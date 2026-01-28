'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, getCurrentUser } from '@/lib/auth'
import ThemeToggle from '../components/ThemeToggle'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        try {
            await signIn(email, password)
            setSuccess('Login successful! Redirecting...')

            setTimeout(async () => {
                const user = await getCurrentUser()
                if (user?.role === 'admin') router.push('/admin')
                else if (user?.role === 'doctor') router.push('/doctor')
                else router.push('/patient')
            }, 1000)
        } catch (err: any) {
            setError(err.message || 'Invalid email or password')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-500">
            <ThemeToggle className="absolute top-4 right-4" />
            <div className="w-full max-w-sm bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl transition-colors duration-500">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-500 to-teal-400 rounded-xl mb-3 shadow-lg shadow-cyan-500/20">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-teal-500 dark:from-cyan-400 dark:to-teal-400 bg-clip-text text-transparent">
                        PhysioFlow
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">AI-Powered Physiotherapy</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Welcome Back</h2>

                    {error && (
                        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-xs">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 dark:bg-green-500/10 dark:border-green-500/30 rounded-lg text-green-600 dark:text-green-400 text-xs">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            {success}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Email</label>
                        <input
                            type="email"
                            placeholder="doctor@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:opacity-50 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                disabled={loading}
                                className="w-full px-3 py-2.5 pr-10 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:opacity-50 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 mt-2 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-lg text-white dark:text-slate-900 text-sm font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin"></span>
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>

                    <p className="text-center text-slate-500 dark:text-slate-400 text-xs">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-cyan-400 font-semibold hover:text-teal-400 transition-colors">
                            Sign up
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    )
}
