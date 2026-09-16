'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SessionData {
    id: string
    accuracy: number
    duration: number
    started_at: string
    exerciseName: string
}

export default function ProgressChart({ userId }: { userId: string }) {
    const [sessions, setSessions] = useState<SessionData[]>([])
    const [loading, setLoading] = useState(true)
    const [metric, setMetric] = useState<'accuracy' | 'duration'>('accuracy')
    const [hovered, setHovered] = useState<number | null>(null)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('sessions')
                .select('id, accuracy, duration, started_at, exercise_id')
                .eq('patient_id', userId)
                .order('started_at', { ascending: true })
            if (error || !data?.length) {
                setSessions([])
                setLoading(false)
                return
            }
            const { data: ex } = await supabase.from('exercises').select('id, name')
            const names = new Map(ex?.map(e => [e.id, e.name]) || [])
            setSessions(data.map(s => ({
                id: s.id,
                accuracy: s.accuracy || 0,
                duration: s.duration || 0,
                started_at: s.started_at,
                exerciseName: names.get(s.exercise_id) || 'Session',
            })))
            setLoading(false)
        }
        load()
    }, [userId])

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                </CardHeader>
                <CardContent><Skeleton className="h-40 w-full" /></CardContent>
            </Card>
        )
    }

    if (sessions.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center py-10 text-center">
                    <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <TrendingUp className="size-5" />
                    </div>
                    <p className="text-sm font-medium">No progress data yet</p>
                    <p className="mt-1 max-w-xs text-sm text-muted-foreground">Complete your assigned exercises to record accuracy and duration.</p>
                </CardContent>
            </Card>
        )
    }

    const W = 500, H = 150, PL = 35, PR = 15, PT = 15, PB = 25
    const cw = W - PL - PR, ch = H - PT - PB
    const isAcc = metric === 'accuracy'
    const values = sessions.map(s => (isAcc ? s.accuracy : s.duration))
    const max = isAcc ? 100 : Math.max(...values, 5)

    const points = sessions.map((s, i) => ({
        ...s,
        value: isAcc ? s.accuracy : s.duration,
        x: PL + (i / (sessions.length - 1 || 1)) * cw,
        y: PT + (1 - (isAcc ? s.accuracy : s.duration) / max) * ch,
        date: new Date(s.started_at),
    }))
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaD = `${pathD} L ${points[points.length - 1].x} ${H - PB} L ${points[0].x} ${H - PB} Z`
    const active = hovered !== null ? points[hovered] : points[points.length - 1]
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

    return (
        <Card>
            <CardHeader>
                <CardTitle>Progress</CardTitle>
                <CardDescription>Session history over time</CardDescription>
                <CardAction>
                    <Tabs value={metric} onValueChange={v => { setMetric(v as typeof metric); setHovered(null) }}>
                        <TabsList>
                            <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
                            <TabsTrigger value="duration">Duration</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardAction>
            </CardHeader>
            <CardContent className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
                <div className="h-[140px] w-full lg:col-span-2">
                    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible">
                        {[PT, PT + ch / 2, H - PB].map((y, i) => (
                            <line key={i} x1={PL} y1={y} x2={W - PR} y2={y} className="stroke-border" strokeDasharray={i < 2 ? '3 3' : undefined} />
                        ))}
                        <text x={PL - 6} y={PT + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">{isAcc ? '100%' : `${max}s`}</text>
                        <text x={PL - 6} y={PT + ch / 2 + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">{isAcc ? '50%' : `${Math.round(max / 2)}s`}</text>
                        <text x={PL - 6} y={H - PB + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">0</text>

                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d={areaD} fill="url(#chartGradient)" />
                        <path d={pathD} fill="none" className="stroke-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                        {points.map((p, i) => {
                            const on = hovered === i || (hovered === null && i === points.length - 1)
                            return (
                                <g key={p.id}>
                                    {on && <line x1={p.x} y1={p.y} x2={p.x} y2={H - PB} className="stroke-muted-foreground/40" strokeDasharray="2" />}
                                    <circle cx={p.x} cy={p.y} r={on ? 5 : 3} className={cn('fill-background stroke-2', on ? 'stroke-foreground' : 'stroke-muted-foreground')} />
                                    <rect x={p.x - 12} y={PT} width={24} height={ch} fill="transparent" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
                                </g>
                            )
                        })}
                        {[0, Math.round(points.length / 2), points.length - 1].map(i => points[i] && (
                            <text key={points[i].id} x={points[i].x} y={H - 10} textAnchor="middle" className="fill-muted-foreground text-[9px]">{fmt(points[i].date)}</text>
                        ))}
                    </svg>
                </div>

                <div className="flex flex-col justify-between rounded-lg border bg-muted/40 p-4">
                    <div>
                        <p className="truncate text-sm font-medium">{active.exerciseName}</p>
                        <p className="text-xs text-muted-foreground">
                            {active.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-md border bg-background p-2 text-center">
                            <p className="text-xs text-muted-foreground">Accuracy</p>
                            <p className="text-lg font-semibold tabular-nums">{active.accuracy}%</p>
                        </div>
                        <div className="rounded-md border bg-background p-2 text-center">
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="text-lg font-semibold tabular-nums">{Math.round(active.duration / 60) || 1}m</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
