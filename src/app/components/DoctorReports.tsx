'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { FileText, Download } from 'lucide-react'

interface Session { id: string; accuracy: number; duration: number; started_at: string; exercise_id: string }

interface Patient { id: string; name: string; email?: string; injury?: string; age?: number; phone?: string; diet_plan?: string }
interface Assignment { id: string; patient_id: string; exercise_id: string; sets: number; reps_per_set: number; notes?: string; status?: string; completed?: boolean | string }
interface Props {
    patients: Patient[]
    assignments: Assignment[]
    exercises?: { id: string; name: string }[]
}

const isDone = (a: Assignment) => a.status?.toLowerCase() === 'completed' || a.completed === true || a.completed === 'true'

export default function DoctorReports({ patients, assignments, exercises = [] }: Props) {
    const [patientId, setPatientId] = useState<string>(patients[0]?.id || '')
    const [sessions, setSessions] = useState<Session[]>([])

    useEffect(() => {
        if (patients.length && !patients.find(p => p.id === patientId)) setPatientId(patients[0].id)
    }, [patients, patientId])

    useEffect(() => {
        if (!patientId) return
        supabase.from('sessions').select('id, accuracy, duration, started_at, exercise_id').eq('patient_id', patientId).order('started_at', { ascending: false })
            .then(({ data }) => setSessions(data || []))
    }, [patientId])

    const patient = patients.find(p => p.id === patientId)
    const patientAssignments = useMemo(() => assignments.filter(a => a.patient_id === patientId), [assignments, patientId])
    const completed = patientAssignments.filter(isDone).length
    const compliance = patientAssignments.length ? Math.round((completed / patientAssignments.length) * 100) : 0
    const avgAccuracy = sessions.length ? Math.round(sessions.reduce((s, x) => s + (x.accuracy || 0), 0) / sessions.length) : 0
    const totalMinutes = Math.round(sessions.reduce((s, x) => s + (x.duration || 0), 0) / 60)
    const exerciseName = (id: string) => exercises.find(e => e.id === id)?.name || 'Unknown'

    const handleExport = async () => {
        if (!patient) return
        try {
            const jsPDF = (await import('jspdf')).default
            const autoTable = (await import('jspdf-autotable')).default
            const doc = new jsPDF()

            doc.setFillColor(0, 0, 0)
            doc.rect(0, 0, 210, 32, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(20)
            doc.text('PhysioFlow', 20, 16)
            doc.setFontSize(11)
            doc.text('Rehabilitation report', 20, 25)

            doc.setTextColor(0, 0, 0)
            doc.setFontSize(10)
            doc.text(`Patient: ${patient.name}`, 20, 44)
            doc.text(`Condition: ${patient.injury || 'General recovery'}`, 20, 50)
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 44)

            const metrics = [
                ['Compliance', `${compliance}%`],
                ['Avg. accuracy', `${avgAccuracy}%`],
                ['Sessions', `${sessions.length}`],
                ['Total time', `${totalMinutes}m`],
            ]
            metrics.forEach(([label, value], i) => {
                const x = 20 + i * 45
                doc.setDrawColor(200)
                doc.rect(x, 58, 40, 22)
                doc.setFontSize(8)
                doc.text(label, x + 3, 65)
                doc.setFontSize(13)
                doc.setFont('helvetica', 'bold')
                doc.text(value, x + 3, 75)
                doc.setFont('helvetica', 'normal')
            })

            doc.setFontSize(13)
            doc.text('Assigned exercises', 20, 94)
            autoTable(doc, {
                startY: 98,
                head: [['Exercise', 'Sets × reps', 'Status', 'Notes']],
                body: patientAssignments.map(a => [exerciseName(a.exercise_id), `${a.sets} × ${a.reps_per_set}`, isDone(a) ? 'Completed' : 'Pending', a.notes || '-']),
                theme: 'grid',
                headStyles: { fillColor: [0, 0, 0] },
            })

            if (sessions.length) {
                const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
                doc.setFontSize(13)
                doc.text('Session history', 20, y)
                autoTable(doc, {
                    startY: y + 4,
                    head: [['Date', 'Exercise', 'Accuracy', 'Duration']],
                    body: sessions.map(s => [new Date(s.started_at).toLocaleDateString(), exerciseName(s.exercise_id), `${s.accuracy}%`, `${Math.round(s.duration / 60) || 1}m`]),
                    theme: 'grid',
                    headStyles: { fillColor: [0, 0, 0] },
                })
            }

            const pages = doc.getNumberOfPages()
            for (let i = 1; i <= pages; i++) {
                doc.setPage(i)
                doc.setFontSize(8)
                doc.setTextColor(150)
                doc.text(`Page ${i} of ${pages}`, 105, 290, { align: 'center' })
            }
            doc.save(`PhysioFlow_Report_${patient.name.replace(/\s+/g, '_')}.pdf`)
        } catch {
            toast.error('Failed to generate PDF')
        }
    }

    if (patients.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center py-12 text-center">
                    <FileText className="mb-3 size-8 text-muted-foreground" />
                    <p className="text-sm font-medium">No patients to report on</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">Compliance and session accuracy per patient.</p>
                <div className="flex items-center gap-2">
                    <Select value={patientId} onValueChange={v => setPatientId(v as string)} items={Object.fromEntries(patients.map(p => [p.id, p.name]))}>
                        <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
                        <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleExport}><Download /> Export PDF</Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardDescription>Compliance</CardDescription>
                        <CardTitle className="text-3xl tabular-nums">{compliance}%</CardTitle>
                    </CardHeader>
                    <CardContent><Progress value={compliance} /><p className="mt-2 text-xs text-muted-foreground">{completed} of {patientAssignments.length} completed</p></CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Avg. form accuracy</CardDescription>
                        <CardTitle className="text-3xl tabular-nums">{avgAccuracy}%</CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-xs text-muted-foreground">Across {sessions.length} session{sessions.length === 1 ? '' : 's'}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Sessions</CardDescription>
                        <CardTitle className="text-3xl tabular-nums">{sessions.length}</CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-xs text-muted-foreground">Last: {sessions[0] ? new Date(sessions[0].started_at).toLocaleDateString() : '—'}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Total time</CardDescription>
                        <CardTitle className="text-3xl tabular-nums">{totalMinutes}m</CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-xs text-muted-foreground">Exercise time logged</p></CardContent>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <Card>
                        <CardHeader><CardTitle>Assigned exercises</CardTitle></CardHeader>
                        <CardContent>
                            {patientAssignments.length ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Exercise</TableHead>
                                            <TableHead>Sets × reps</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {patientAssignments.map(a => (
                                            <TableRow key={a.id}>
                                                <TableCell className="font-medium">{exerciseName(a.exercise_id)}</TableCell>
                                                <TableCell className="text-muted-foreground">{a.sets} × {a.reps_per_set}</TableCell>
                                                <TableCell>{isDone(a) ? <Badge variant="secondary" className="text-success">Completed</Badge> : <Badge variant="outline">Pending</Badge>}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="py-6 text-center text-sm text-muted-foreground">No exercises assigned.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Session history</CardTitle></CardHeader>
                        <CardContent>
                            {sessions.length ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Exercise</TableHead>
                                            <TableHead>Accuracy</TableHead>
                                            <TableHead>Duration</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sessions.slice(0, 10).map(s => (
                                            <TableRow key={s.id}>
                                                <TableCell className="text-muted-foreground">{new Date(s.started_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="font-medium">{exerciseName(s.exercise_id)}</TableCell>
                                                <TableCell className="tabular-nums">{s.accuracy}%</TableCell>
                                                <TableCell className="tabular-nums text-muted-foreground">{Math.round(s.duration / 60) || 1}m</TableCell>
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

                <Card className="h-fit">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Avatar className="size-10"><AvatarFallback>{(patient?.name || 'P').split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                            <div className="min-w-0">
                                <CardTitle className="truncate">{patient?.name}</CardTitle>
                                <CardDescription className="truncate">{patient?.email}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Condition</span><span className="font-medium">{patient?.injury || 'General recovery'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span className="font-medium">{patient?.age || '—'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{patient?.phone || '—'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Diet plan</span><span className="font-medium">{patient?.diet_plan ? 'Assigned' : 'None'}</span></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
