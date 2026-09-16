'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, getCurrentUser } from '@/lib/auth'
import AuthLayout from '../components/AuthLayout'
import GoogleButton from '../components/GoogleButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react'

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
                router.push(user?.role === 'doctor' ? '/doctor' : '/patient')
            }, 600)
        } catch (err) {
            setError((err as Error).message || 'Invalid email or password')
            setLoading(false)
        }
    }

    return (
        <AuthLayout title="Welcome back" subtitle="Sign in to your PhysioFlow account.">
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
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} disabled={loading} className="pr-9" />
                        <Button type="button" variant="ghost" size="icon-sm" className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(s => !s)} aria-label="Toggle password visibility">
                            {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="animate-spin" />}
                    {loading ? 'Signing in…' : 'Sign in'}
                </Button>

                <GoogleButton onError={setError} />

                <p className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">Sign up</Link>
                </p>
            </form>
        </AuthLayout>
    )
}
