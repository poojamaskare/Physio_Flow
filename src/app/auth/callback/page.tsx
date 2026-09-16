'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { resolveOAuthUser, completeOAuthSignUp } from '@/lib/auth'
import AuthLayout from '../../components/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Loader2 } from 'lucide-react'

const INJURIES = ['Knee Pain', 'Back Pain', 'Shoulder', 'Neck Pain', 'Hip Pain', 'Ankle', 'Post Surgery', 'Sports Injury', 'Other']

export default function AuthCallbackPage() {
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'choose-role' | 'error'>('loading')
    const [error, setError] = useState('')
    const [name, setName] = useState('')
    const [role, setRole] = useState<'doctor' | 'patient'>('patient')
    const [age, setAge] = useState('')
    const [injury, setInjury] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        resolveOAuthUser()
            .then(({ user, name }) => {
                if (user) return router.replace(user.role === 'doctor' ? '/doctor' : '/patient')
                setName(name)
                setStatus('choose-role')
            })
            .catch(err => { setError((err as Error).message); setStatus('error') })
    }, [router])

    const finish = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            await completeOAuthSignUp(role, role === 'patient' ? { age: age ? parseInt(age) : null, injury } : undefined)
            router.replace(role === 'doctor' ? '/doctor' : '/patient')
        } catch (err) {
            setError((err as Error).message || 'Failed to create account')
            setSaving(false)
        }
    }

    if (status === 'loading') {
        return <div className="flex min-h-dvh items-center justify-center bg-background"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
    }

    if (status === 'error') {
        return (
            <AuthLayout title="Sign-in failed" subtitle="Something went wrong with Google sign-in.">
                <Alert variant="destructive"><AlertCircle /><AlertDescription>{error}</AlertDescription></Alert>
                <Button className="mt-4 w-full" variant="outline" onClick={() => router.replace('/login')}>Back to login</Button>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout title={`Welcome, ${name.split(' ')[0]}`} subtitle="One last step — tell us how you'll use PhysioFlow.">
            <form onSubmit={finish} className="space-y-4">
                {error && <Alert variant="destructive"><AlertCircle /><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="space-y-2">
                    <Label>I am a</Label>
                    <Select value={role} onValueChange={v => setRole(v as 'doctor' | 'patient')}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="patient">Patient</SelectItem>
                            <SelectItem value="doctor">Doctor</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {role === 'patient' && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="age">Age</Label>
                            <Input id="age" type="number" min={1} max={120} value={age} onChange={e => setAge(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Condition</Label>
                            <Select value={injury || null} onValueChange={v => setInjury(v ?? '')}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
                                <SelectContent>{INJURIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
                <Button type="submit" className="w-full" disabled={saving}>
                    {saving && <Loader2 className="animate-spin" />}
                    Continue
                </Button>
            </form>
        </AuthLayout>
    )
}
