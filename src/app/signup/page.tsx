'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth'
import ThemeToggle from '../components/ThemeToggle'

export default function SignupPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        age: '',
        injury: '',
        role: 'patient' as 'admin' | 'doctor' | 'patient'
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)

        try {
            await signUp(
                formData.email,
                formData.password,
                formData.name,
                formData.role,
                formData.role === 'patient' ? {
                    phone: formData.phone,
                    age: formData.age ? parseInt(formData.age) : null,
                    injury: formData.injury
                } : { phone: formData.phone }
            )
            setSuccess('Registration successful! Redirecting...')

            setTimeout(() => {
                if (formData.role === 'admin') router.push('/admin')
                else if (formData.role === 'doctor') router.push('/doctor')
                else router.push('/patient')
            }, 1000)
        } catch (err: any) {
            setError(err.message || 'Failed to create account')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-500">
            <ThemeToggle className="absolute top-4 right-4" />
            <div className="w-full max-w-sm bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto transition-colors duration-500">
                {/* Header */}
                <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-400 rounded-xl mb-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                        </svg>
                    </div>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-teal-500 dark:from-cyan-400 dark:to-teal-400 bg-clip-text text-transparent">
                        PhysioFlow
                    </h1>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Create Account</h2>

                    {error && (
                        <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-xs">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            {success}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-300">I am a</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:opacity-50 transition-all"
                        >
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-300">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Raj Sharma"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:opacity-50 transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-300">Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="raj@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:opacity-50 transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-300">Phone (Optional)</label>
                        <input
                            type="tel"
                            name="phone"
                            placeholder="+91 98765 43210"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:opacity-50 transition-all"
                        />
                    </div>

                    {/* Patient-specific fields */}
                    {formData.role === 'patient' && (
                        <div className="p-3 bg-cyan-50 border border-cyan-100 dark:bg-cyan-500/10 dark:border-cyan-500/20 rounded-lg space-y-3">
                            <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">🩹 Patient Information</p>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-300">Age</label>
                                    <input
                                        type="number"
                                        name="age"
                                        placeholder="25"
                                        value={formData.age}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:opacity-50 transition-all"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-300">Injury</label>
                                    <select
                                        name="injury"
                                        value={formData.injury}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:opacity-50 transition-all"
                                    >
                                        <option value="">Select...</option>
                                        <option value="Knee Pain">Knee Pain</option>
                                        <option value="Back Pain">Back Pain</option>
                                        <option value="Shoulder">Shoulder</option>
                                        <option value="Neck Pain">Neck Pain</option>
                                        <option value="Hip Pain">Hip Pain</option>
                                        <option value="Ankle">Ankle</option>
                                        <option value="Post Surgery">Post Surgery</option>
                                        <option value="Sports Injury">Sports</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-300">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="Minimum 6 characters"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                disabled={loading}
                                className="w-full px-3 py-2 pr-10 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:opacity-50 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                                {showPassword ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-300">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                placeholder="Re-enter password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                minLength={6}
                                disabled={loading}
                                className="w-full px-3 py-2 pr-10 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:opacity-50 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                                {showConfirmPassword ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                        className="w-full py-2.5 mt-1 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-lg text-white dark:text-slate-900 text-sm font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span>
                                Creating account...
                            </>
                        ) : (
                            'Sign Up'
                        )}
                    </button>

                    <p className="text-center text-slate-400 text-xs">
                        Already have an account?{' '}
                        <Link href="/login" className="text-cyan-400 font-semibold hover:text-teal-400 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    )
}
