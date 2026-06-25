'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, getCurrentUser } from '@/lib/auth'
import ThemeToggle from '../components/ThemeToggle'
import { Activity, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'

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
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-surface via-surface-container-low to-surface-container dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-500">
            <ThemeToggle className="absolute top-4 right-4" />
            <div className="w-full max-w-[380px] bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-outline-variant/30 dark:border-white/10 rounded-2xl p-6 shadow-2xl transition-colors duration-500">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 dark:bg-primary/20 border border-primary/20 rounded-xl mb-3 shadow-sm">
                        <Activity size={28} className="text-primary" />
                    </div>
                    <h1 className="font-headline-md text-2xl text-on-surface tracking-tighter uppercase">
                        PhysioFlow
                    </h1>
                    <p className="font-label-md text-on-surface-variant text-xs mt-1">AI-Powered Physiotherapy</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="font-headline-md text-lg text-on-surface uppercase tracking-tight">Welcome Back</h2>

                    {error && (
                        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-xs">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 dark:bg-green-500/10 dark:border-green-500/30 rounded-lg text-green-600 dark:text-green-400 text-xs">
                            <CheckCircle size={14} />
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
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 transition-all"
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
                                className="w-full px-3 py-2.5 pr-10 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 mt-4 bg-primary text-white rounded-lg font-label-caps uppercase tracking-wider scale-[0.98] hover:scale-100 active:scale-[0.98] transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Signing in...
                            </div>
                        ) : (
                            'Sign In'
                        )}
                    </button>

                    <p className="text-center text-slate-500 dark:text-slate-400 text-xs">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-primary font-semibold hover:opacity-80 transition-colors">
                            Sign up
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    )
}
