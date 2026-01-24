'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut, User } from '@/lib/auth'

export default function DoctorDashboard() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const currentUser = await getCurrentUser()
        if (!currentUser || currentUser.role !== 'doctor') {
            router.push('/login')
            return
        }
        setUser(currentUser)
        setLoading(false)
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
            {/* Header */}
            <header className="flex justify-between items-center px-8 py-5 bg-slate-800/80 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center gap-3">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                    <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                        RehabAI
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    className="px-5 py-2 border border-white/20 rounded-lg text-slate-300 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400 transition-all"
                >
                    Logout
                </button>
            </header>

            {/* Main */}
            <main className="max-w-6xl mx-auto px-8 py-10">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold mb-2">Welcome, Dr. {user?.name}!</h1>
                    <span className="inline-block px-4 py-1.5 bg-cyan-500/15 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-semibold uppercase tracking-wide">
                        Doctor Dashboard
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Coming Soon Cards */}
                    <div className="relative p-8 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl opacity-60">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 mb-6">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">My Patients</h3>
                        <p className="text-slate-400">View and manage your assigned patients</p>
                        <span className="absolute bottom-6 right-6 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold uppercase">
                            Coming Soon
                        </span>
                    </div>

                    <div className="relative p-8 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl opacity-60">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 mb-6">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 7l-7 5 7 5V7z"></path>
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Upload Exercise Video</h3>
                        <p className="text-slate-400">Add new exercise videos for patients</p>
                        <span className="absolute bottom-6 right-6 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold uppercase">
                            Coming Soon
                        </span>
                    </div>

                    <div className="relative p-8 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl opacity-60">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 mb-6">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Patient Reports</h3>
                        <p className="text-slate-400">Review progress and generate reports</p>
                        <span className="absolute bottom-6 right-6 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold uppercase">
                            Coming Soon
                        </span>
                    </div>

                    <div className="relative p-8 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl opacity-60">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 mb-6">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Diet Plans</h3>
                        <p className="text-slate-400">Create personalized diet plans</p>
                        <span className="absolute bottom-6 right-6 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold uppercase">
                            Coming Soon
                        </span>
                    </div>
                </div>
            </main>
        </div>
    )
}
