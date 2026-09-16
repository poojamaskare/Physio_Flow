'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth'
import AuthLayout from '../components/AuthLayout'
import GoogleButton from '../components/GoogleButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react'

const INJURIES = ['Knee Pain', 'Back Pain', 'Shoulder', 'Neck Pain', 'Hip Pain', 'Ankle', 'Post Surgery', 'Sports Injury', 'Other']

export default function SignupPage() {
    const router = useRouter()
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '', phone: '', age: '', injury: '',
        role: 'patient' as 'doctor' | 'patient',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        if (form.password !== form.confirmPassword) return setError('Passwords do not match')
        if (form.password.length < 6) return setError('Password must be at least 6 characters')

        setLoading(true)
        try {
            await signUp(
                form.email, form.password, form.name, form.role,
                form.role === 'patient'
                    ? { phone: form.phone, age: form.age ? parseInt(form.age) : null, injury: form.injury }
                    : { phone: form.phone }
            )
            setSuccess('Registration successful! Redirecting...')
            setTimeout(() => router.push(form.role === 'doctor' ? '/doctor' : '/patient'), 600)
        } catch (err) {
            setError((err as Error).message || 'Failed to create account')
            setLoading(false)
        }
    }

    const passwordType = showPassword ? 'text' : 'password'

    return (
        <AuthLayout title="Create account" subtitle="Start your physiotherapy and recovery program.">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {success && (
                    <Alert>
                        <CheckCircle />
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label>I am a</Label>
                    <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as 'doctor' | 'patient' }))}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="patient">Patient</SelectItem>
                            <SelectItem value="doctor">Doctor</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" placeholder="Jane Doe" value={form.name} onChange={set('name')} required disabled={loading} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required disabled={loading} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Phone <span className="text-muted-foreground">(optional)</span></Label>
                    <Input id="phone" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} disabled={loading} />
                </div>

                {form.role === 'patient' && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="age">Age</Label>
                            <Input id="age" type="number" min={1} max={120} placeholder="28" value={form.age} onChange={set('age')} disabled={loading} />
                        </div>
                        <div className="space-y-2">
                            <Label>Condition</Label>
                            <Select value={form.injury || null} onValueChange={v => setForm(f => ({ ...f, injury: v ?? '' }))}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
                                <SelectContent>
                                    {INJURIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Input id="password" type={passwordType} placeholder="Minimum 6 characters" value={form.password} onChange={set('password')} required minLength={6} disabled={loading} className="pr-9" />
                        <Button type="button" variant="ghost" size="icon-sm" className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(s => !s)} aria-label="Toggle password visibility">
                            {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm password</Label>
                    <Input id="confirm" type={passwordType} placeholder="Re-enter password" value={form.confirmPassword} onChange={set('confirmPassword')} required disabled={loading} />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="animate-spin" />}
                    {loading ? 'Creating account…' : 'Sign up'}
                </Button>

                <GoogleButton onError={setError} />

                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">Sign in</Link>
                </p>
            </form>
        </AuthLayout>
    )
}
