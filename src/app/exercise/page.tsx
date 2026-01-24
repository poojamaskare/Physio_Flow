'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut, User } from '@/lib/auth'

export default function ExercisePage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const currentUser = await getCurrentUser()
        if (!currentUser || currentUser.role !== 'patient') {
            router.push('/login')
            return
        }
        setUser(currentUser)
        setLoading(false)
    }

    const handleBack = () => {
        router.push('/patient')
    }

    const handleLogout = async () => {
        await signOut()
        router.push('/login')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                Loading...
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-white/10 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Back to Dashboard
                </button>

                <div className="flex items-center gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                    <span className="font-bold text-lg bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                        RehabAI Exercise
                    </span>
                </div>

                <button
                    onClick={handleLogout}
                    className="px-4 py-2 border border-white/20 rounded-full text-slate-300 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400 transition-all"
                >
                    Logout
                </button>
            </div>

            {/* Exercise Area */}
            <div className="pt-24 px-6 pb-6 min-h-screen flex flex-col items-center justify-center">
                <div className="text-center max-w-2xl">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-3xl mb-8">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                        </svg>
                    </div>

                    <h1 className="text-4xl font-bold mb-4">Exercise Session</h1>
                    <p className="text-slate-400 text-lg mb-8">
                        Welcome, {user?.name}! Your AI-powered physiotherapy session will start here.
                    </p>

                    <div className="bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8">
                        <h2 className="text-xl font-semibold mb-4 text-cyan-400">🎯 Coming Soon</h2>
                        <ul className="text-left text-slate-300 space-y-3">
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                                Real-time pose detection with camera feed
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                                Green/Red skeleton feedback
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                                Repetition counting
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                                Reference video comparison
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                                AI-powered correction feedback
                            </li>
                        </ul>
                    </div>

                    <p className="text-slate-500 text-sm">
                        The pose detection engine from your original physioflow app will be integrated here.
                    </p>
                </div>
            </div>
        </div>
    )
}
