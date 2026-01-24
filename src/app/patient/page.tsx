'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, signOut, User } from '@/lib/auth'

export default function PatientDashboard() {
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
                    <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}!</h1>
                    <span className="inline-block px-4 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-semibold uppercase tracking-wide">
                        Patient Dashboard
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {/* Start Exercise Card */}
                    <Link href="/exercise" className="group relative p-8 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-cyan-500/40 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 mb-6">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Start Exercise</h3>
                        <p className="text-slate-400">Begin your daily physiotherapy session</p>
                        <span className="absolute top-8 right-8 text-2xl text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all">
                            →
                        </span>
                    </Link>

                    {/* Coming Soon Cards */}
                    <div className="relative p-8 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl opacity-60">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 mb-6">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 20V10M12 20V4M6 20v-6"></path>
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">My Progress</h3>
                        <p className="text-slate-400">View your exercise history and stats</p>
                        <span className="absolute bottom-6 right-6 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold uppercase">
                            Coming Soon
                        </span>
                    </div>

                    <div className="relative p-8 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl opacity-60">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 mb-6">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">My Doctor</h3>
                        <p className="text-slate-400">Contact your assigned doctor</p>
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
                        <h3 className="text-xl font-semibold mb-2">Diet Plan</h3>
                        <p className="text-slate-400">View your personalized diet recommendations</p>
                        <span className="absolute bottom-6 right-6 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold uppercase">
                            Coming Soon
                        </span>
                    </div>
                </div>
            </main>
        </div>
    )
}
