'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCurrentUser, signOut, User } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Sidebar from '../components/Sidebar'
import ThemeToggle from '../components/ThemeToggle'
import Link from 'next/link'
import { FileText, Flame, BarChart3, Phone, Menu, Activity } from 'lucide-react'

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
    completed?: boolean
    exercise?: Exercise
}

function PatientDashboardContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    // Default to 'dashboard' if no tab param is present
    const activeTab = searchParams.get('tab') || 'dashboard'

    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [assignments, setAssignments] = useState<PatientExercise[]>([])
    const [doctor, setDoctor] = useState<{ name: string; email: string; phone: string } | null>(null)
    const [dietPlan, setDietPlan] = useState<string | null>(null)
    const [progress, setProgress] = useState({ completed: 0, total: 0 })
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
        const completed = exercises.filter(e => e.status === 'completed' || e.completed).length
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

        setDietPlan(data?.diet_plan || 'Stay hydrated and eat balanced meals.')
    }

    const handleLogout = async () => {
        await signOut()
        router.push('/login')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500"></div>
            </div>
        )
    }

    const pendingExercises = assignments.filter(e => e.status !== 'completed' && !e.completed).length
    const progressPercentage = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0

    // Render helper for the main dashboard view
    const renderDashboard = () => (
        <div className="space-y-6">
            {/* Recovery Progress - Large Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 absolute inset-0 opacity-50"></div>

                <div className="relative z-10 flex-1 text-center md:text-left">
                    <h2 className="text-xl font-bold mb-2">Recovery Progress</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                        You're making excellent progress! Keep following your treatment plan to reach full recovery.
                    </p>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="transform -rotate-90 w-full h-full">
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * progressPercentage) / 100} strokeLinecap="round" className="text-cyan-500 transition-all duration-1000 ease-out" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-slate-900 dark:text-white">{progressPercentage}%</span>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Complete</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/exercise" className="block group">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 h-full hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer relative overflow-hidden">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                            <FileText size={24} className="text-white" />
                        </div>
                        <h3 className="font-bold text-lg mb-1 group-hover:text-purple-500 transition-colors">Today's Exercise</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {pendingExercises} exercise{pendingExercises !== 1 && 's'} pending
                        </p>
                    </div>
                </Link>

                <Link href="/patient?tab=diet" className="block group">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 h-full hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                            <Flame size={24} className="text-white" />
                        </div>
                        <h3 className="font-bold text-lg mb-1 group-hover:text-emerald-500 transition-colors">Diet Plan</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm truncate">
                            View your meal plan
                        </p>
                    </div>
                </Link>

                <Link href="/patient?tab=progress" className="block group">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 h-full hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
                            <BarChart3 size={24} className="text-white" />
                        </div>
                        <h3 className="font-bold text-lg mb-1 group-hover:text-orange-500 transition-colors">My Progress</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Track improvements
                        </p>
                    </div>
                </Link>

                <div className="bg-gradient-to-br from-cyan-400 to-teal-400 p-6 rounded-3xl shadow-sm h-full text-white relative overflow-hidden group hover:shadow-cyan-500/20 hover:shadow-lg transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 text-white">
                        <Phone size={24} className="text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">Call Doctor</h3>
                    <p className="text-white/80 text-sm mb-1">
                        {doctor ? `Speak to ${doctor.name}` : 'Contact Support'}
                    </p>
                </div>
            </div>
        </div>
    )

    // Render helper for diet plan view
    const renderDietPlan = () => (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Flame size={24} /></span>
                Your Diet Plan
            </h2>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-white/5">
                <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                    {dietPlan}
                </p>
            </div>
        </div>
    )

    // Render helper for progress view
    const renderProgress = () => (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="p-2 bg-orange-500/10 rounded-lg text-orange-500"><BarChart3 size={24} /></span>
                My Progress
            </h2>
            <div className="grid gap-6">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-white/5">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Overall Completion</h3>
                        <span className="text-3xl font-bold text-cyan-500">{progressPercentage}%</span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <p className="mt-4 text-slate-500 dark:text-slate-400">
                        You have completed <span className="font-bold text-slate-900 dark:text-white">{progress.completed}</span> out of <span className="font-bold text-slate-900 dark:text-white">{progress.total}</span> assigned exercises.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-white/5">
                    <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Exercise History</h3>
                    {assignments.length > 0 ? (
                        <div className="space-y-4">
                            {assignments.map((assignment, i) => (
                                <div key={assignment.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-white/5 hover:border-cyan-500/20 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-12 rounded-full ${assignment.status === 'completed' || assignment.completed ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white">{assignment.exercise?.name}</p>
                                            <p className="text-xs text-slate-500">{assignment.sets} sets • {assignment.reps_per_set} reps</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${assignment.status === 'completed' || assignment.completed
                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                        }`}>
                                        {assignment.status === 'completed' || assignment.completed ? 'Completed' : 'Pending'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-500">
                            No activity recorded yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300 font-sans">
            <Sidebar 
                user={user} 
                onLogout={handleLogout} 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                     <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300">
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-lg bg-gradient-to-r from-cyan-600 to-teal-500 dark:from-cyan-400 dark:to-teal-400 bg-clip-text text-transparent">
                        PhysioFlow
                    </span>
                </div>
                <ThemeToggle />
            </div>

            <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300">
                {/* Top Header Area */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-1">
                            {activeTab === 'dashboard' && `Welcome Back, ${user?.name?.split(' ')[0]}!`}
                            {activeTab === 'diet' && 'Diet Plan'}
                            {activeTab === 'progress' && 'Progress Tracking'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            {activeTab === 'dashboard' && 'Keep up the great work on your recovery journey.'}
                            {activeTab === 'diet' && 'A personalized nutrition plan for your recovery.'}
                            {activeTab === 'progress' && 'Visualize your improvement over time.'}
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <ThemeToggle />
                    </div>
                </div>

                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'diet' && renderDietPlan()}
                {activeTab === 'progress' && renderProgress()}
            </main>
        </div>
    )

}

export default function PatientDashboard() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><div className="w-8 h-8 border-2 border-cyan-500 rounded-full animate-spin border-t-transparent"></div></div>}>
            <PatientDashboardContent />
        </Suspense>
    )
}
