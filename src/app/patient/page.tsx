'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut, User } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import ThemeToggle from '../components/ThemeToggle'

interface Exercise {
    id: string
    name: string
    description: string
    duration_seconds: number
    difficulty: string
    video_url: string
}

interface PatientExercise {
    id: string
    exercise_id: string
    reps_per_set: number
    sets: number
    notes: string
    status: string
    exercise?: Exercise
}

export default function PatientDashboard() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [assignments, setAssignments] = useState<PatientExercise[]>([])
    const [doctor, setDoctor] = useState<{ name: string; email: string; phone: string } | null>(null)
    const [dietPlan, setDietPlan] = useState<string | null>(null)
    const [progress, setProgress] = useState({ completed: 0, total: 0 })

    useEffect(() => {
        checkAuth()
    }, [])

    useEffect(() => {
        if (user) {
            fetchAssignments()
            fetchDoctor()
            fetchDietPlan()
        }
    }, [user])

    const checkAuth = async () => {
        const currentUser = await getCurrentUser()
        if (!currentUser || currentUser.role !== 'patient') {
            router.push('/login')
            return
        }
        setUser(currentUser)
        setLoading(false)
    }

    const fetchAssignments = async () => {
        if (!user) return

        const { data } = await supabase
            .from('patient_exercises')
            .select(`
                *,
                exercise:exercises(*)
            `)
            .eq('patient_id', user.id)

        const exercises = data || []
        setAssignments(exercises)

        // Calculate progress
        const completed = exercises.filter(e => e.status === 'completed').length
        setProgress({
            completed,
            total: exercises.length
        })
    }

    const fetchDoctor = async () => {
        if (!user) return

        const { data: patientData } = await supabase
            .from('users')
            .select('doctor_id')
            .eq('id', user.id)
            .single()

        if (patientData?.doctor_id) {
            const { data: doctorData } = await supabase
                .from('users')
                .select('name, email, phone')
                .eq('id', patientData.doctor_id)
                .single()

            setDoctor(doctorData)
        }
    }

    const fetchDietPlan = async () => {
        if (!user) return

        const { data } = await supabase
            .from('users')
            .select('diet_plan')
            .eq('id', user.id)
            .single()

        setDietPlan(data?.diet_plan || 'Remember to stay hydrated and eat balanced meals to support your recovery!')
    }

    const handleLogout = async () => {
        await signOut()
        router.push('/login')
    }

    const startSession = () => {
        router.push('/exercise')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                <span className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></span>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
            {/* Header */}
            <header className="flex justify-between items-center px-8 py-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                    <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                        PhysioFlow
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <button
                        onClick={handleLogout}
                        className="px-5 py-2 border border-slate-200 dark:border-white/20 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500 hover:text-red-500 dark:hover:text-red-400 transition-all"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-6xl mx-auto px-8 py-10">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}!</h1>
                    <div className="flex items-center gap-3">
                        <span className="inline-block px-4 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-semibold uppercase tracking-wide">
                            Patient Dashboard
                        </span>
                        {doctor && (
                            <span className="text-slate-400 text-sm">
                                👨‍⚕️ Assigned to <span className="text-cyan-400">{doctor.name}</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Exercise Session Card */}
                {
                    assignments.length > 0 ? (
                        <div className="mb-8 p-8 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/30 rounded-2xl">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Your Exercise Plan</h2>
                                    <p className="text-slate-400">
                                        {assignments.length} exercise{assignments.length > 1 ? 's' : ''} assigned by your doctor
                                    </p>
                                </div>
                                <button
                                    onClick={startSession}
                                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-xl text-slate-900 font-bold flex items-center gap-3 hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-1 transition-all"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="5,3 19,12 5,21"></polygon>
                                    </svg>
                                    Start Session
                                </button>
                            </div>

                            {/* Exercise List */}
                            <div className="grid gap-4">
                                {assignments.map((assignment, index) => (
                                    <div
                                        key={assignment.id}
                                        className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-white/5"
                                    >
                                        <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400 font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{assignment.exercise?.name || 'Exercise'}</h3>
                                            <p className="text-sm text-slate-400">
                                                {assignment.sets} sets × {assignment.reps_per_set} reps
                                                {assignment.notes && ` • ${assignment.notes}`}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${assignment.exercise?.difficulty === 'easy'
                                            ? 'bg-green-500/20 text-green-400'
                                            : assignment.exercise?.difficulty === 'hard'
                                                ? 'bg-red-500/20 text-red-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {assignment.exercise?.difficulty || 'medium'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mb-8 p-8 bg-slate-800/50 border border-white/10 rounded-2xl text-center">
                            <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No Exercises Assigned Yet</h3>
                            <p className="text-slate-400 mb-4">
                                Your doctor will assign exercises for you to practice.
                                Check back later or contact your doctor.
                            </p>
                        </div>
                    )
                }

                {/* Additional Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* My Progress */}
                    <div className="p-6 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 20V10M12 20V4M6 20v-6"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">My Progress</h3>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-3xl font-bold text-white">{progress.completed}</span>
                            <span className="text-slate-400 mb-1">/ {progress.total} exercises</span>
                        </div>
                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-500 transition-all duration-500"
                                style={{ width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* My Doctor */}
                    <div className="p-6 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">My Doctor</h3>
                        {doctor ? (
                            <div className="space-y-2 text-sm text-slate-300">
                                <p className="font-medium text-white text-base">{doctor.name}</p>
                                <p className="flex items-center gap-2">
                                    <span>📧</span> {doctor.email}
                                </p>
                                <p className="flex items-center gap-2">
                                    <span>📞</span> {doctor.phone || 'No phone provided'}
                                </p>
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm">No doctor assigned yet.</p>
                        )}
                    </div>

                    {/* Diet Plan */}
                    <div className="p-6 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Diet Plan</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            {dietPlan}
                        </p>
                    </div>
                </div>
            </main >
        </div >
    )
}
