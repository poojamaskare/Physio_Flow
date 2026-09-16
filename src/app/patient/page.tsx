'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, signOut, User } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import AppShell from '../components/AppShell'
import ProgressChart from '../components/ProgressChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, Calendar, CheckCircle2, ChevronRight, Flame, Utensils, Mail, Loader2 } from 'lucide-react'

interface Exercise { id: string; name: string; description: string; duration_seconds: number; difficulty: string; video_url: string }
interface PatientExercise { id: string; exercise_id: string; reps_per_set: number; sets: number; notes: string; status: string; completed?: boolean; exercise?: Exercise }
interface Session { id: string; accuracy: number; duration: number; started_at: string; exerciseName: string }

const dateKey = (d: Date) => d.toISOString().slice(0, 10)

// Counts consecutive days with ≥1 session, backwards from today (or yesterday if today is empty).
function getStreak(sessions: Session[]) {
    const days = new Set(sessions.map(s => dateKey(new Date(s.started_at))))
    const cursor = new Date()
    if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
    let n = 0
    while (days.has(dateKey(cursor))) { n++; cursor.setDate(cursor.getDate() - 1) }
    return n
}

function getHeatmapDays(sessions: Session[], days = 28) {
    const count = new Map<string, number>()
    sessions.forEach(s => { const k = dateKey(new Date(s.started_at)); count.set(k, (count.get(k) || 0) + 1) })
    return Array.from({ length: days }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (days - 1 - i))
        const key = dateKey(d)
        return { key, count: count.get(key) || 0 }
    })
}

function accuracyBadge(a: number) {
    if (a >= 90) return <Badge variant="secondary" className="text-success">Optimal</Badge>
    if (a >= 70) return <Badge variant="secondary" className="text-warning">Satisfactory</Badge>
    return <Badge variant="destructive">Needs review</Badge>
}

function PatientDashboardContent() {
    const router = useRouter()
    const activeTab = useSearchParams().get('tab') || 'dashboard'

    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [assignments, setAssignments] = useState<PatientExercise[]>([])
    const [sessions, setSessions] = useState<Session[]>([])
    const [doctor, setDoctor] = useState<{ name: string; email: string; phone: string } | null>(null)
    const [dietPlan, setDietPlan] = useState<string | null>(null)

    useEffect(() => {
        (async () => {
            const current = await getCurrentUser()
            if (!current || current.role !== 'patient') return router.push('/login')
            const { data } = await supabase.from('users').select('id, email, name, role, phone, age, injury, doctor_id, diet_plan').eq('id', current.id).single()
            if (data) {
                setUser({ id: data.id, email: data.email, name: data.name, role: 'patient', phone: data.phone || undefined, age: data.age, injury: data.injury || undefined })
                setDietPlan(data.diet_plan || null)
                if (data.doctor_id) {
                    const { data: doc } = await supabase.from('users').select('name, email, phone').eq('id', data.doctor_id).single()
                    setDoctor(doc)
                }
            } else {
                setUser(current)
            }
            setLoading(false)
        })()
    }, [router])

    useEffect(() => {
        if (!user) return
        supabase.from('patient_exercises').select('*, exercise:exercises(*)').eq('patient_id', user.id).then(({ data }) => setAssignments(data || []))
        ;(async () => {
            const { data } = await supabase.from('sessions').select('id, accuracy, duration, started_at, exercise_id').eq('patient_id', user.id).order('started_at', { ascending: false })
            if (!data) return
            const { data: ex } = await supabase.from('exercises').select('id, name')
            const names = new Map(ex?.map(e => [e.id, e.name]) || [])
            setSessions(data.map(s => ({ id: s.id, accuracy: s.accuracy || 0, duration: s.duration || 0, started_at: s.started_at, exerciseName: names.get(s.exercise_id) || 'Session' })))
        })()
    }, [user])

    const handleLogout = async () => { await signOut(); router.push('/login') }

    if (loading) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-background">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const completed = assignments.filter(a => a.status === 'completed' || a.completed).length
    const pct = assignments.length ? Math.round((completed / assignments.length) * 100) : 0
    const streak = getStreak(sessions)
    const heatmap = getHeatmapDays(sessions)
    const avgAccuracy = sessions.length ? Math.round(sessions.reduce((s, x) => s + x.accuracy, 0) / sessions.length) : 0
    const today = dateKey(new Date())
    const doneToday = new Set(sessions.filter(s => dateKey(new Date(s.started_at)) === today).map(s => s.exerciseName)).size
    const now = new Date()
    const activeDays = new Set(sessions.map(s => new Date(s.started_at)).filter(d => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()).map(dateKey)).size

    const titles: Record<string, string> = { dashboard: 'Dashboard', diet: 'Diet plan', progress: 'Progress' }

    return (
        <AppShell user={user} onLogout={handleLogout} title={titles[activeTab] || 'Dashboard'} activeTab={activeTab}>
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'there'}</h2>
                        <p className="text-sm text-muted-foreground">
                            Day {streak} of your {(user?.injury || 'recovery').toLowerCase()} plan{doctor ? ` with ${doctor.name}` : ''}.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader>
                                <CardDescription>Recovery progress</CardDescription>
                                <CardTitle className="text-2xl tabular-nums">{pct}%</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Progress value={pct} />
                                <p className="mt-2 text-xs text-muted-foreground">{completed} of {assignments.length} exercises completed</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardDescription>Day streak</CardDescription>
                                <CardTitle className="flex items-center gap-2 text-2xl tabular-nums"><Flame className="size-5 text-warning" />{streak}</CardTitle>
                            </CardHeader>
                            <CardContent><p className="text-xs text-muted-foreground">Consecutive active days</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardDescription>Avg. form accuracy</CardDescription>
                                <CardTitle className="text-2xl tabular-nums">{avgAccuracy}%</CardTitle>
                            </CardHeader>
                            <CardContent><p className="text-xs text-muted-foreground">Across {sessions.length} sessions</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardDescription>Active days this month</CardDescription>
                                <CardTitle className="text-2xl tabular-nums">{activeDays}<span className="text-base font-normal text-muted-foreground">/{now.getDate()}</span></CardTitle>
                            </CardHeader>
                            <CardContent><p className="text-xs text-muted-foreground">{doneToday} exercise{doneToday === 1 ? '' : 's'} done today</p></CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        <div className="space-y-4 lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Today&apos;s plan</CardTitle>
                                    <CardDescription>{doctor ? `Assigned by ${doctor.name}` : 'Assigned exercises'} · {assignments.length} exercise{assignments.length === 1 ? '' : 's'}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {assignments.length ? (
                                        <ul className="divide-y">
                                            {assignments.map(a => {
                                                const done = a.status === 'completed' || a.completed
                                                return (
                                                    <li key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                                        <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-md', done ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}>
                                                            {done ? <CheckCircle2 className="size-4" /> : <Activity className="size-4" />}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium">{a.exercise?.name}</p>
                                                            <p className="text-xs text-muted-foreground">{a.sets} sets · {a.reps_per_set} reps{a.notes ? ` · ${a.notes}` : ''}</p>
                                                        </div>
                                                        {done ? (
                                                            <Badge variant="secondary">Done</Badge>
                                                        ) : (
                                                            <Button size="sm" nativeButton={false} render={<Link href="/exercise" />}>Start <ChevronRight /></Button>
                                                        )}
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="py-6 text-center text-sm text-muted-foreground">No exercises assigned yet.</p>
                                    )}
                                </CardContent>
                            </Card>
                            {user?.id && <ProgressChart userId={user.id} />}
                        </div>

                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Your physiotherapist</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm font-medium">{doctor?.name || 'No doctor assigned'}</p>
                                    {doctor && (
                                        <Button variant="outline" size="sm" className="w-full" nativeButton={false} render={<a href={`mailto:${doctor.email}`} />}>
                                            <Mail /> Message doctor
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Activity</CardTitle>
                                    <CardDescription>Last 28 days</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {heatmap.map(d => (
                                            <span key={d.key} title={d.key} className={cn('aspect-square rounded-sm', d.count === 0 ? 'bg-muted' : d.count === 1 ? 'bg-success/50' : 'bg-success')} />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Utensils className="size-4" />Diet plan</CardTitle>
                                    <CardAction>
                                        <Button variant="link" size="sm" nativeButton={false} render={<Link href="/patient?tab=diet" />}>View</Button>
                                    </CardAction>
                                </CardHeader>
                                <CardContent>
                                    <p className="line-clamp-3 text-sm text-muted-foreground">{dietPlan || 'No diet plan assigned yet.'}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'diet' && (
                <div className="mx-auto max-w-2xl space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Diet plan</CardTitle>
                            <CardDescription>Dietary instructions prescribed by {doctor?.name || 'your doctor'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {dietPlan ? (
                                <p className="text-sm leading-relaxed whitespace-pre-line">{dietPlan}</p>
                            ) : (
                                <p className="py-6 text-center text-sm text-muted-foreground">No diet plan assigned yet. Stay hydrated and eat balanced meals.</p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>General rehabilitation guidelines</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                                <li>Increase lean protein intake to support muscle and joint tissue repair.</li>
                                <li>Incorporate anti-inflammatory foods (omega-3 rich fish, leafy greens, berries).</li>
                                <li>Stay hydrated: aim for 2.5–3 litres of water daily.</li>
                                <li>Limit processed sugars and alcohol, which can worsen inflammation.</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'progress' && (
                <div className="space-y-4">
                    {user?.id && <ProgressChart userId={user.id} />}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Calendar className="size-4" />Session history</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {sessions.length ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Exercise</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Accuracy</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sessions.map(s => (
                                            <TableRow key={s.id}>
                                                <TableCell className="font-medium">{s.exerciseName}</TableCell>
                                                <TableCell className="text-muted-foreground">{new Date(s.started_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                                                <TableCell className="tabular-nums text-muted-foreground">{Math.round(s.duration / 60) || 1}m</TableCell>
                                                <TableCell className="flex items-center gap-2"><span className="tabular-nums">{s.accuracy}%</span>{accuracyBadge(s.accuracy)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="py-6 text-center text-sm text-muted-foreground">No sessions recorded yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </AppShell>
    )
}

export default function PatientDashboard() {
    return (
        <Suspense fallback={<div className="flex min-h-dvh items-center justify-center bg-background"><Skeleton className="size-6 rounded-full" /></div>}>
            <PatientDashboardContent />
        </Suspense>
    )
}
