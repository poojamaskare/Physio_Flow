'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth'
import ThemeToggle from '../components/ThemeToggle'
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Phone, 
  UserCheck, 
  Lock 
} from 'lucide-react'

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
        <main className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-background">
            <style>{`
                .clinical-input {
                    background-color: transparent;
                    border-top: none;
                    border-left: none;
                    border-right: none;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 0;
                    transition: border-bottom-color 0.3s ease;
                }
                .dark .clinical-input {
                    border-bottom-color: rgba(255, 255, 255, 0.2);
                    color: #ffffff;
                }
                .clinical-input:focus {
                    outline: none;
                    box-shadow: none;
                    border-bottom-color: #ad2c00;
                }
                .dark .clinical-input:focus {
                    border-bottom-color: #ad2c00;
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s infinite ease-in-out;
                }
            `}</style>

            {/* Left Side: Signup Form */}
            <section className="flex-1 flex flex-col justify-center items-center px-6 lg:px-16 py-12 bg-surface-container-lowest relative overflow-y-auto max-h-screen">
                {/* Theme Toggle */}
                <ThemeToggle className="absolute top-4 right-4 z-50" />

                {/* Branding Overlay */}
                <div className="absolute top-8 left-8">
                    <span className="font-headline-md text-headline-md tracking-tighter text-on-surface">PHYSIOFLOW</span>
                </div>

                <div className="w-full max-w-[420px] space-y-6 my-auto pt-12">
                    <header className="space-y-1">
                        <h1 className="font-headline-lg text-3xl uppercase text-on-surface tracking-tight">Create Account</h1>
                        <p className="text-body-md text-on-surface-variant">Start your clinical physiotherapy and recovery program.</p>
                    </header>

                    {/* Signup Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
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

                        <div className="space-y-1">
                            <label className="font-label-sm text-xs text-secondary uppercase tracking-widest block">I am a</label>
                            <div className="relative group">
                                <UserCheck className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full clinical-input pl-8 py-2 text-body-md bg-transparent text-on-surface focus:outline-none"
                                >
                                    <option value="patient" className="bg-surface text-on-surface">Patient</option>
                                    <option value="doctor" className="bg-surface text-on-surface">Doctor</option>
                                    <option value="admin" className="bg-surface text-on-surface">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="font-label-sm text-xs text-secondary uppercase tracking-widest block">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Raj Sharma"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full clinical-input pl-8 py-2 text-body-md placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-transparent text-on-surface"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="font-label-sm text-xs text-secondary uppercase tracking-widest block">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="raj@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full clinical-input pl-8 py-2 text-body-md placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-transparent text-on-surface"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="font-label-sm text-xs text-secondary uppercase tracking-widest block">Phone (Optional)</label>
                            <div className="relative group">
                                <Phone className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="+91 98765 43210"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full clinical-input pl-8 py-2 text-body-md placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-transparent text-on-surface"
                                />
                            </div>
                        </div>

                        {/* Patient-specific fields */}
                        {formData.role === 'patient' && (
                            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-4 animate-in fade-in duration-300">
                                <p className="text-xs text-primary font-bold tracking-wider uppercase">🩹 Patient Information</p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="font-label-sm text-[10px] text-secondary uppercase tracking-widest block">Age</label>
                                        <input
                                            type="number"
                                            name="age"
                                            placeholder="25"
                                            value={formData.age}
                                            onChange={handleChange}
                                            disabled={loading}
                                            className="w-full clinical-input py-2 text-body-md placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-transparent text-on-surface"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="font-label-sm text-[10px] text-secondary uppercase tracking-widest block">Injury</label>
                                        <select
                                            name="injury"
                                            value={formData.injury}
                                            onChange={handleChange}
                                            disabled={loading}
                                            className="w-full clinical-input py-2 text-body-md bg-transparent text-on-surface focus:outline-none"
                                        >
                                            <option value="" className="bg-surface text-on-surface">Select...</option>
                                            <option value="Knee Pain" className="bg-surface text-on-surface">Knee Pain</option>
                                            <option value="Back Pain" className="bg-surface text-on-surface">Back Pain</option>
                                            <option value="Shoulder" className="bg-surface text-on-surface">Shoulder</option>
                                            <option value="Neck Pain" className="bg-surface text-on-surface">Neck Pain</option>
                                            <option value="Hip Pain" className="bg-surface text-on-surface">Hip Pain</option>
                                            <option value="Ankle" className="bg-surface text-on-surface">Ankle</option>
                                            <option value="Post Surgery" className="bg-surface text-on-surface">Post Surgery</option>
                                            <option value="Sports Injury" className="bg-surface text-on-surface">Sports</option>
                                            <option value="Other" className="bg-surface text-on-surface">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="font-label-sm text-xs text-secondary uppercase tracking-widest block">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Minimum 6 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    disabled={loading}
                                    className="w-full clinical-input pl-8 py-2 pr-10 text-body-md placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-transparent text-on-surface"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors hover:cursor-pointer"
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="font-label-sm text-xs text-secondary uppercase tracking-widest block">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    placeholder="Re-enter password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    disabled={loading}
                                    className="w-full clinical-input pl-8 py-2 pr-10 text-body-md placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-transparent text-on-surface"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors hover:cursor-pointer"
                                >
                                    {showConfirmPassword ? (
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
                            className="w-full bg-primary text-white py-3 px-8 rounded-full font-label-md text-xs uppercase tracking-widest scale-[0.98] hover:scale-100 active:scale-[0.98] transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-4"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Creating account...
                                </div>
                            ) : (
                                'Sign Up'
                            )}
                        </button>

                        <footer className="text-center pt-4">
                            <p className="text-body-md text-on-surface-variant text-xs">
                                Already have an account?{' '}
                                <Link href="/login" className="text-primary font-bold hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </footer>
                    </form>
                </div>
            </section>

            {/* Right Side: Brand Visual */}
            <section className="hidden md:flex flex-1 bg-surface-container-low relative overflow-hidden flex-col justify-center items-center px-8">
                {/* Main Content Container */}
                <div className="relative z-10 w-full max-w-[600px] flex flex-col items-center gap-12">
                    {/* Illustration Frame */}
                    <div className="w-full aspect-square max-w-[420px] bg-white dark:bg-slate-800 rounded-full border border-outline-variant/20 flex items-center justify-center relative shadow-sm">
                        <div className="w-5/6 h-5/6 rounded-full overflow-hidden relative">
                            <img className="w-full h-full object-cover" alt="A clean high-fidelity clinical illustration for a physiotherapy app. A stylized human figure in a meditative pose with a heart icon centered in the chest, representing cardiac and physical recovery. The background consists of soft teal and orange-red geometric shapes with clean black line art. The overall aesthetic is professional, medical, and minimalist in a high-contrast white room environment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9lbSzSCGvR65CDdF27XdsETD_d1vVF6OGjOFbQXuSpNVoRM-hK4HIDwZXrTgdgx_MY3FEL014YCd8QjW-LVvzLmJJ_bh3tSaolGTn5WWFjXDy_XF_myELigmLDaOOpgTUz3ntIEHvniYBgKkpsI1_O-sz7AcTWSQKIK7T1y5_niscOgxSiyUnZQHTNYIKEK1atj6_9xTqlN2GycApFaMGImUJ6VhXbf-w-4Ks6i6k4R4bxrFcB0vkNVGFspH4JxlMBCycjBTK8ROD"/>
                        </div>
                        {/* Floating Stat UI */}
                        <div className="absolute -bottom-6 -left-4 bg-white dark:bg-slate-900 border border-outline-variant/30 p-4 rounded-xl shadow-lg w-[200px] animate-bounce-slow">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-label-sm text-[10px] text-secondary uppercase tracking-tighter">Daily Target</span>
                                <Activity className="text-primary w-4.5 h-4.5" />
                            </div>
                            <div className="font-headline-md text-2xl leading-none text-on-surface">84%</div>
                            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                                <div className="bg-primary h-full w-[84%]"></div>
                            </div>
                            <p className="text-[10px] mt-1 text-on-surface-variant font-label-md">2.4km Tracking Completed</p>
                        </div>
                        {/* Floating User Card */}
                        <div className="absolute top-1/4 -right-8 bg-white dark:bg-slate-900 border border-outline-variant/30 p-2.5 rounded-full flex items-center gap-3 shadow-md animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-primary-fixed overflow-hidden">
                                <img className="w-full h-full object-cover" alt="Dr. Sarah Jenkins" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwek-8eCUjMvGooWaACH9wrC5x87nl1liwamZ7OCXZOwUBGWt2MSmjhnjk2zQqJNmTbNv5aqH8EKG6jPIghU00Kunj-Im0-ENa4sDExBCU5jtxAvDLmDd5yBzMvzQUZ_-erjZoIlr1wQ3PHh0Wi6BglWO2BdO4VEeOWdFLjleki-Cqg3bQF3e3-vM1aGFlveqpBeem25hh0Kn_A9nQSP8V3HWhX2GClcXzAt0bhqXHNXuce3QGgUl3vUZPl37xnvZisGh4bkLOGqd3"/>
                            </div>
                            <div className="pr-4">
                                <p className="text-[10px] font-bold leading-none text-on-surface">Dr. Sarah Jenkins</p>
                                <p className="text-[8px] text-secondary uppercase tracking-widest mt-0.5">Supervisor</p>
                            </div>
                        </div>
                    </div>
                    {/* Brand Promise */}
                    <div className="text-center space-y-4">
                        <h2 className="font-headline-md text-2xl uppercase max-w-[400px] mx-auto leading-tight text-on-surface">
                            Make your work easier and organized with <span className="text-primary">PhysioFlow</span>
                        </h2>
                        <div className="flex justify-center gap-2">
                            <div className="w-8 h-1 bg-primary rounded-full"></div>
                            <div className="w-2 h-1 bg-outline-variant/30 rounded-full"></div>
                            <div className="w-2 h-1 bg-outline-variant/30 rounded-full"></div>
                        </div>
                    </div>
                </div>
                {/* Copyright */}
                <div className="absolute bottom-8 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Elite Clinical Performance System v2.4.0
                </div>
            </section>
        </main>
    )
}