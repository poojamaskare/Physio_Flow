'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut, User } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import DoctorProgress from '@/app/components/DoctorProgress'

type Tab = 'dashboard' | 'patients' | 'exercises' | 'reports'

interface Exercise {
    id: string
    name: string
    description: string
    duration_seconds: number
    difficulty: string
    video_url: string
}

interface Patient {
    id: string
    name: string
    email: string
    injury: string
    age: number
    phone: string
}

interface PatientExercise {
    id: string
    patient_id: string
    exercise_id: string
    reps_per_set: number
    sets: number
    notes: string
    patient?: Patient
    exercise?: Exercise
}

export default function DoctorDashboard() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<Tab>('dashboard')

    // Data states
    const [patients, setPatients] = useState<Patient[]>([])
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [assignments, setAssignments] = useState<PatientExercise[]>([])

    // Modal states
    const [showAddExercise, setShowAddExercise] = useState(false)
    const [showAssignExercise, setShowAssignExercise] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

    // Form states
    const [newExercise, setNewExercise] = useState({ name: '', description: '', duration_seconds: 60, difficulty: 'medium', video_url: '' })
    const [assignForm, setAssignForm] = useState({ exercise_name: '', reps_per_set: 10, sets: 3, notes: '' })
    const [assignVideoFile, setAssignVideoFile] = useState<File | null>(null)
    const [assigningExercise, setAssigningExercise] = useState(false)

    // Video upload states
    const [uploadingVideo, setUploadingVideo] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [videoFile, setVideoFile] = useState<File | null>(null)

    useEffect(() => {
        checkAuth()
    }, [])

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    const checkAuth = async () => {
        const currentUser = await getCurrentUser()
        if (!currentUser || currentUser.role !== 'doctor') {
            router.push('/login')
            return
        }
        setUser(currentUser)
        setLoading(false)
    }

    const fetchData = async () => {
        // Fetch only patients assigned to this doctor
        const { data: patientsData } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'patient')
            .eq('doctor_id', user?.id)
        setPatients(patientsData || [])

        // Fetch exercises
        const { data: exercisesData } = await supabase
            .from('exercises')
            .select('*')
        setExercises(exercisesData || [])

        // Fetch assignments
        const { data: assignmentsData } = await supabase
            .from('patient_exercises')
            .select('*')
        setAssignments(assignmentsData || [])
    }

    const handleLogout = async () => {
        await signOut()
        router.push('/login')
    }

    const addExercise = async () => {
        if (!newExercise.name) return

        let videoUrl = newExercise.video_url

        // Upload video if file selected
        if (videoFile) {
            setUploadingVideo(true)
            setUploadProgress(10)

            const fileExt = videoFile.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

            setUploadProgress(30)

            const { data, error: uploadError } = await supabase.storage
                .from('exercise-videos')
                .upload(fileName, videoFile, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) {
                console.error('Upload error:', uploadError)
                setUploadingVideo(false)
                return
            }

            setUploadProgress(80)

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('exercise-videos')
                .getPublicUrl(fileName)

            videoUrl = publicUrl
            setUploadProgress(100)
        }

        const { error } = await supabase.from('exercises').insert([{
            ...newExercise,
            video_url: videoUrl,
            created_by: user?.id
        }])

        if (!error) {
            setShowAddExercise(false)
            setNewExercise({ name: '', description: '', duration_seconds: 60, difficulty: 'medium', video_url: '' })
            setVideoFile(null)
            setUploadingVideo(false)
            setUploadProgress(0)
            fetchData()
        }
    }

    const assignExercise = async () => {
        if (!selectedPatient || !assignForm.exercise_name || !assignVideoFile) return

        setAssigningExercise(true)

        try {
            // 1. Upload video
            const fileExt = assignVideoFile.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('exercise-videos')
                .upload(fileName, assignVideoFile, { cacheControl: '3600', upsert: false })

            if (uploadError) {
                console.error('Upload error:', uploadError)
                setAssigningExercise(false)
                return
            }

            // 2. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('exercise-videos')
                .getPublicUrl(fileName)

            // 3. Create exercise
            const { data: exerciseData, error: exerciseError } = await supabase
                .from('exercises')
                .insert([{
                    name: assignForm.exercise_name,
                    description: assignForm.notes,
                    video_url: publicUrl,
                    created_by: user?.id
                }])
                .select()
                .single()

            if (exerciseError || !exerciseData) {
                console.error('Exercise create error:', exerciseError)
                setAssigningExercise(false)
                return
            }

            // 4. Assign to patient
            const { error } = await supabase.from('patient_exercises').insert([{
                patient_id: selectedPatient.id,
                exercise_id: exerciseData.id,
                assigned_by: user?.id,
                reps_per_set: assignForm.reps_per_set,
                sets: assignForm.sets,
                notes: assignForm.notes
            }])

            if (!error) {
                setShowAssignExercise(false)
                setSelectedPatient(null)
                setAssignForm({ exercise_name: '', reps_per_set: 10, sets: 3, notes: '' })
                setAssignVideoFile(null)
                fetchData()
            }
        } catch (err) {
            console.error('Error assigning exercise:', err)
        } finally {
            setAssigningExercise(false)
        }
    }

    const removeAssignment = async (assignmentId: string) => {
        await supabase.from('patient_exercises').delete().eq('id', assignmentId)
        fetchData()
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                Loading...
            </div>
        )
    }

    const sidebarItems = [
        { id: 'dashboard' as Tab, label: 'Dashboard', icon: '📊' },
        { id: 'patients' as Tab, label: 'My Patients', icon: '👥' },
        { id: 'exercises' as Tab, label: 'Exercise Library', icon: '🏋️' },
        { id: 'reports' as Tab, label: 'Reports', icon: '📈' },
    ]

    const getPatientAssignments = (patientId: string) => {
        return assignments.filter(a => a.patient_id === patientId)
    }

    const getExerciseName = (exerciseId: string) => {
        return exercises.find(e => e.id === exerciseId)?.name || 'Unknown'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800/80 backdrop-blur-xl border-r border-white/10 flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                        </svg>
                        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            PhysioFlow
                        </span>
                    </div>
                </div>

                <nav className="flex-1 p-4">
                    {sidebarItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all ${activeTab === item.id
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'hover:bg-white/5 text-slate-300'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center font-bold">
                            {user?.name?.charAt(0) || 'D'}
                        </div>
                        <div>
                            <p className="font-medium text-sm">Dr. {user?.name}</p>
                            <p className="text-xs text-slate-400">Doctor</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 border border-white/20 rounded-lg text-slate-300 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400 transition-all text-sm"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Welcome Banner */}
                        <div className="relative overflow-hidden p-8 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 rounded-3xl">
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                            </div>
                            <div className="relative z-10">
                                <h1 className="text-4xl font-bold mb-2">Welcome back, Dr. {user?.name}! 👋</h1>
                                <p className="text-white/80 text-lg">Manage your patients and exercises from your personalized dashboard</p>
                            </div>
                            <div className="absolute right-8 bottom-0 text-[120px] opacity-20">🩺</div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="group p-6 bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl hover:border-blue-500/40 transition-all cursor-pointer" onClick={() => setActiveTab('patients')}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">👥</div>
                                    <span className="text-xs px-2 py-1 bg-blue-500/20 rounded-full text-blue-400">View →</span>
                                </div>
                                <div className="text-4xl font-bold text-white mb-1">{patients.length}</div>
                                <div className="text-slate-400">Total Patients</div>
                            </div>

                            <div className="group p-6 bg-gradient-to-br from-teal-500/20 to-teal-600/10 backdrop-blur-xl border border-teal-500/20 rounded-2xl hover:border-teal-500/40 transition-all cursor-pointer" onClick={() => setActiveTab('exercises')}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-teal-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🏋️</div>
                                    <span className="text-xs px-2 py-1 bg-teal-500/20 rounded-full text-teal-400">Add →</span>
                                </div>
                                <div className="text-4xl font-bold text-white mb-1">{exercises.length}</div>
                                <div className="text-slate-400">Exercises</div>
                            </div>

                            <div className="group p-6 bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl hover:border-purple-500/40 transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">📋</div>
                                    <span className="text-xs px-2 py-1 bg-purple-500/20 rounded-full text-purple-400">Active</span>
                                </div>
                                <div className="text-4xl font-bold text-white mb-1">{assignments.length}</div>
                                <div className="text-slate-400">Assignments</div>
                            </div>

                            <div className="group p-6 bg-gradient-to-br from-amber-500/20 to-amber-600/10 backdrop-blur-xl border border-amber-500/20 rounded-2xl hover:border-amber-500/40 transition-all cursor-pointer" onClick={() => setActiveTab('reports')}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">📊</div>
                                    <span className="text-xs px-2 py-1 bg-amber-500/20 rounded-full text-amber-400">Soon</span>
                                </div>
                                <div className="text-4xl font-bold text-white mb-1">--</div>
                                <div className="text-slate-400">Reports</div>
                            </div>
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Quick Actions */}
                            <div className="p-6 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl">
                                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <span className="text-2xl">⚡</span> Quick Actions
                                </h2>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => { setActiveTab('exercises'); setShowAddExercise(true); }}
                                        className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-xl hover:border-cyan-500/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📹</div>
                                        <div className="text-left flex-1">
                                            <div className="font-semibold">Upload Exercise Video</div>
                                            <div className="text-sm text-slate-400">Add a new exercise with video</div>
                                        </div>
                                        <span className="text-cyan-400">→</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('patients')}
                                        className="w-full flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">👥</div>
                                        <div className="text-left flex-1">
                                            <div className="font-semibold">Manage Patients</div>
                                            <div className="text-sm text-slate-400">View & assign exercises</div>
                                        </div>
                                        <span className="text-slate-400">→</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('exercises')}
                                        className="w-full flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📚</div>
                                        <div className="text-left flex-1">
                                            <div className="font-semibold">Exercise Library</div>
                                            <div className="text-sm text-slate-400">Browse all exercises</div>
                                        </div>
                                        <span className="text-slate-400">→</span>
                                    </button>
                                </div>
                            </div>

                            {/* Getting Started / Recent Activity */}
                            <div className="p-6 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl">
                                {exercises.length === 0 && patients.length === 0 ? (
                                    <>
                                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                            <span className="text-2xl">🚀</span> Getting Started
                                        </h2>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                                                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-lg font-bold text-cyan-400">1</div>
                                                <div className="flex-1">
                                                    <div className="font-medium">Upload Your First Exercise</div>
                                                    <div className="text-sm text-slate-400">Add exercise videos to your library</div>
                                                </div>
                                                <span className="text-amber-400">⏳</span>
                                            </div>
                                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl opacity-60">
                                                <div className="w-10 h-10 rounded-full bg-slate-500/20 flex items-center justify-center text-lg font-bold text-slate-400">2</div>
                                                <div className="flex-1">
                                                    <div className="font-medium">Wait for Patients to Register</div>
                                                    <div className="text-sm text-slate-400">They'll appear in My Patients</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl opacity-60">
                                                <div className="w-10 h-10 rounded-full bg-slate-500/20 flex items-center justify-center text-lg font-bold text-slate-400">3</div>
                                                <div className="flex-1">
                                                    <div className="font-medium">Assign Exercises to Patients</div>
                                                    <div className="text-sm text-slate-400">Personalize their rehab plan</div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                            <span className="text-2xl">📊</span> Overview
                                        </h2>
                                        <div className="space-y-4">
                                            {exercises.length > 0 && (
                                                <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-teal-400 font-medium">Exercises Ready</span>
                                                        <span className="text-2xl font-bold text-white">{exercises.length}</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500" style={{ width: `${Math.min(exercises.length * 20, 100)}%` }}></div>
                                                    </div>
                                                </div>
                                            )}
                                            {patients.length > 0 && (
                                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-blue-400 font-medium">Active Patients</span>
                                                        <span className="text-2xl font-bold text-white">{patients.length}</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${Math.min(patients.length * 20, 100)}%` }}></div>
                                                    </div>
                                                </div>
                                            )}
                                            {assignments.length > 0 && (
                                                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-purple-400 font-medium">Active Assignments</span>
                                                        <span className="text-2xl font-bold text-white">{assignments.length}</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${Math.min(assignments.length * 10, 100)}%` }}></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Recent Patients Preview */}
                        {patients.length > 0 && (
                            <div className="p-6 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <span className="text-2xl">👥</span> Recent Patients
                                    </h2>
                                    <button onClick={() => setActiveTab('patients')} className="text-cyan-400 hover:text-cyan-300 text-sm">View All →</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {patients.slice(0, 3).map(patient => (
                                        <div key={patient.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center font-bold text-xl">
                                                {patient.name?.charAt(0) || 'P'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{patient.name}</div>
                                                <div className="text-sm text-slate-400 truncate">{patient.email}</div>
                                            </div>
                                            <div className="text-xs px-2 py-1 bg-cyan-500/20 rounded-full text-cyan-400">
                                                {getPatientAssignments(patient.id).length} exercises
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )
                }

                {/* Patients Tab */}
                {activeTab === 'patients' && (
                    <div>
                        <h1 className="text-3xl font-bold mb-8">My Patients</h1>

                        {patients.length === 0 ? (
                            <div className="p-8 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl text-center">
                                <div className="text-6xl mb-4">👥</div>
                                <h3 className="text-xl font-semibold mb-2">No Patients Yet</h3>
                                <p className="text-slate-400">Patients will appear here once they register and you can assign exercises to them</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {patients.map(patient => {
                                    const patientAssignments = getPatientAssignments(patient.id)
                                    return (
                                        <div key={patient.id} className="p-6 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-cyan-500/30 transition-all">
                                            {/* Patient Header */}
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center font-bold text-2xl flex-shrink-0">
                                                    {patient.name?.charAt(0) || 'P'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-xl font-semibold truncate">{patient.name}</h3>
                                                    <p className="text-slate-400 text-sm truncate">{patient.email}</p>
                                                    {patient.age && <p className="text-slate-500 text-xs">Age: {patient.age}</p>}
                                                </div>
                                            </div>

                                            {/* Injury Badge */}
                                            {patient.injury && (
                                                <div className="mb-4">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-sm">
                                                        <span className="text-red-400">🩹</span>
                                                        <span className="text-red-300 font-medium">{patient.injury}</span>
                                                    </span>
                                                </div>
                                            )}

                                            {/* No injury info placeholder */}
                                            {!patient.injury && (
                                                <div className="mb-4 p-3 bg-white/5 rounded-xl border border-dashed border-white/10">
                                                    <p className="text-sm text-slate-500 text-center">No injury details provided</p>
                                                </div>
                                            )}

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 mb-4 text-sm">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 rounded-lg">
                                                    <span className="text-cyan-400">🏋️</span>
                                                    <span className="text-cyan-300">{patientAssignments.length} exercises</span>
                                                </div>
                                                {patient.phone && (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                                                        <span>📱</span>
                                                        <span className="text-slate-400">{patient.phone}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Assigned Exercises */}
                                            {patientAssignments.length > 0 && (
                                                <div className="mb-4 border-t border-white/10 pt-4">
                                                    <p className="text-xs text-slate-500 mb-2">Assigned:</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {patientAssignments.slice(0, 3).map(assignment => (
                                                            <span key={assignment.id} className="px-2 py-1 text-xs bg-teal-500/20 border border-teal-500/30 rounded text-teal-300">
                                                                {getExerciseName(assignment.exercise_id)}
                                                            </span>
                                                        ))}
                                                        {patientAssignments.length > 3 && (
                                                            <span className="px-2 py-1 text-xs bg-white/10 rounded text-slate-400">
                                                                +{patientAssignments.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Button */}
                                            <button
                                                onClick={() => {
                                                    setSelectedPatient(patient)
                                                    setShowAssignExercise(true)
                                                }}
                                                className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                            >
                                                <span>📋</span> Assign Exercise
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Exercises Tab */}
                {
                    activeTab === 'exercises' && (
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <h1 className="text-3xl font-bold">Exercise Library</h1>
                                <button
                                    onClick={() => setShowAddExercise(true)}
                                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl font-semibold hover:opacity-90 transition-all"
                                >
                                    + Add Exercise
                                </button>
                            </div>

                            {exercises.length === 0 ? (
                                <div className="p-8 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl text-center">
                                    <div className="text-6xl mb-4">🏋️</div>
                                    <p className="text-slate-400 mb-4">No exercises in library</p>
                                    <button
                                        onClick={() => setShowAddExercise(true)}
                                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl font-semibold hover:opacity-90 transition-all"
                                    >
                                        Add Your First Exercise
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {exercises.map(exercise => (
                                        <div key={exercise.id} className="p-6 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl">
                                            {exercise.video_url && (
                                                <div className="mb-4 rounded-xl overflow-hidden bg-black aspect-video">
                                                    <video
                                                        src={exercise.video_url}
                                                        className="w-full h-full object-cover"
                                                        controls
                                                        preload="metadata"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="text-3xl">🏋️</div>
                                                <div>
                                                    <h3 className="font-semibold">{exercise.name}</h3>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${exercise.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                                                        exercise.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {exercise.difficulty}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-slate-400 text-sm mb-3">{exercise.description || 'No description'}</p>
                                            <p className="text-xs text-slate-500">Duration: {exercise.duration_seconds}s</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                }

                {/* Reports Tab */}
                {
                    activeTab === 'reports' && (
                        <DoctorProgress doctorId={user?.id} />
                    )
                }
            </main >

            {/* Add Exercise Modal */}
            {
                showAddExercise && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-6">Add New Exercise</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Exercise Name</label>
                                    <input
                                        type="text"
                                        value={newExercise.name}
                                        onChange={e => setNewExercise({ ...newExercise, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                        placeholder="e.g., Shoulder Rotation"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Description</label>
                                    <textarea
                                        value={newExercise.description}
                                        onChange={e => setNewExercise({ ...newExercise, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                        placeholder="Describe the exercise..."
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Duration (sec)</label>
                                        <input
                                            type="number"
                                            value={newExercise.duration_seconds}
                                            onChange={e => setNewExercise({ ...newExercise, duration_seconds: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Difficulty</label>
                                        <select
                                            value={newExercise.difficulty}
                                            onChange={e => setNewExercise({ ...newExercise, difficulty: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Exercise Video</label>
                                    <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center hover:border-cyan-500/50 transition-all">
                                        <input
                                            type="file"
                                            accept="video/*"
                                            onChange={e => {
                                                const file = e.target.files?.[0]
                                                if (file) setVideoFile(file)
                                            }}
                                            className="hidden"
                                            id="video-upload"
                                        />
                                        <label htmlFor="video-upload" className="cursor-pointer">
                                            {videoFile ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-2xl">🎬</span>
                                                    <span className="text-cyan-400">{videoFile.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            setVideoFile(null)
                                                        }}
                                                        className="text-red-400 hover:text-red-300 ml-2"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <span className="text-3xl block mb-2">📹</span>
                                                    <span className="text-slate-400">Click to upload video</span>
                                                    <p className="text-xs text-slate-500 mt-1">MP4, WebM, MOV (max 50MB)</p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                    {uploadingVideo && (
                                        <div className="mt-3">
                                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-300"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">Uploading... {uploadProgress}%</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => setShowAddExercise(false)}
                                    className="flex-1 px-4 py-3 border border-white/20 rounded-xl hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addExercise}
                                    disabled={uploadingVideo}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploadingVideo ? 'Uploading...' : 'Add Exercise'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Assign Exercise Modal */}
            {
                showAssignExercise && selectedPatient && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-2">Assign Exercise</h2>
                            <p className="text-slate-400 mb-6">Assigning to: <span className="text-cyan-400">{selectedPatient.name}</span></p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Exercise Name</label>
                                    <input
                                        type="text"
                                        value={assignForm.exercise_name}
                                        onChange={e => setAssignForm({ ...assignForm, exercise_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                        placeholder="e.g. Knee Stretch, Arm Raise..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Upload Exercise Video</label>
                                    <div className="p-4 border-2 border-dashed border-white/20 rounded-xl text-center hover:border-cyan-500/50 transition-all cursor-pointer">
                                        <input
                                            type="file"
                                            accept="video/*"
                                            onChange={e => {
                                                const file = e.target.files?.[0]
                                                if (file) setAssignVideoFile(file)
                                            }}
                                            className="hidden"
                                            id="assign-video-upload"
                                        />
                                        <label htmlFor="assign-video-upload" className="cursor-pointer">
                                            {assignVideoFile ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-2xl">🎬</span>
                                                    <span className="text-cyan-400">{assignVideoFile.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            setAssignVideoFile(null)
                                                        }}
                                                        className="text-red-400 hover:text-red-300 ml-2"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <span className="text-3xl block mb-2">📹</span>
                                                    <span className="text-slate-400">Click to browse video</span>
                                                    <p className="text-xs text-slate-500 mt-1">MP4, WebM, MOV</p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Sets</label>
                                        <input
                                            type="number"
                                            value={assignForm.sets}
                                            onChange={e => setAssignForm({ ...assignForm, sets: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Reps per Set</label>
                                        <input
                                            type="number"
                                            value={assignForm.reps_per_set}
                                            onChange={e => setAssignForm({ ...assignForm, reps_per_set: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                                    <textarea
                                        value={assignForm.notes}
                                        onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                        placeholder="Any special instructions..."
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => {
                                        setShowAssignExercise(false)
                                        setSelectedPatient(null)
                                    }}
                                    className="flex-1 px-4 py-3 border border-white/20 rounded-xl hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={assignExercise}
                                    disabled={assigningExercise || !assignForm.exercise_name || !assignVideoFile}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {assigningExercise ? 'Uploading...' : 'Assign'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
