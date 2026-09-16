'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut, User } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import AppShell from '../components/AppShell'
import { MenuItem } from '../components/Sidebar'
import DoctorReports from '../components/DoctorReports'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users, Dumbbell, ClipboardList, LayoutDashboard, BarChart, Plus, Trash2, X, Phone, Loader2, Upload, Utensils, Flame, UserPlus, UserMinus, RotateCw } from 'lucide-react'

type Tab = 'dashboard' | 'patients' | 'exercises' | 'reports'

interface Exercise { id: string; name: string; description: string; duration_seconds: number; difficulty: string; video_url: string }
interface Patient { id: string; name: string; email: string; injury: string; age: number; phone: string; diet_plan?: string }
interface PatientExercise { id: string; patient_id: string; exercise_id: string; reps_per_set: number; sets: number; notes: string; status?: string; completed?: boolean }

const INDIAN_DIET_TEMPLATE = `Breakfast:
- 2 Idli with Sambar / 1 cup Upma with vegetables
- 1 cup Tea/Coffee (low sugar)

Mid-Morning:
- 1 Fruit (Apple/Papaya)
- Handful of almonds

Lunch:
- 2 Roti / 1 cup Brown Rice
- 1 cup Dal (Lentils)
- 1 cup Sabzi (Seasonal vegetable)
- Salad and Curd

Evening Snack:
- Roasted Chickpeas / Makhana
- Green Tea

Dinner:
- 1-2 Roti
- Mixed Vegetable Curry / Paneer Bhurji
- 1 cup Turmeric Milk (before bed)`

const initials = (name?: string) => (name || 'P').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()

function FilePicker({ id, file, onChange }: { id: string; file: File | null; onChange: (f: File | null) => void }) {
    return (
        <div>
            <input id={id} type="file" accept="video/*" className="hidden" onChange={e => onChange(e.target.files?.[0] || null)} />
            {file ? (
                <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <span className="truncate">{file.name}</span>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => onChange(null)} aria-label="Remove file"><X /></Button>
                </div>
            ) : (
                <label htmlFor={id} className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-6 text-sm text-muted-foreground hover:bg-muted/50">
                    <Upload className="size-4" /> Choose video file
                </label>
            )}
        </div>
    )
}

export default function DoctorDashboard() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<Tab>('dashboard')

    const [patients, setPatients] = useState<Patient[]>([])
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [assignments, setAssignments] = useState<PatientExercise[]>([])
    const [templates, setTemplates] = useState<Record<string, { status: string; error_message?: string }>>({})

    const [showAddExercise, setShowAddExercise] = useState(false)
    const [showAssignExercise, setShowAssignExercise] = useState(false)
    const [showAssignDiet, setShowAssignDiet] = useState(false)
    const [showAllAssignments, setShowAllAssignments] = useState(false)
    const [showAddPatient, setShowAddPatient] = useState(false)
    const [unassigned, setUnassigned] = useState<Patient[]>([])
    const [addPatientId, setAddPatientId] = useState<string | null>(null)
    const [addingPatient, setAddingPatient] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

    const [newExercise, setNewExercise] = useState({ name: '', description: '', duration_seconds: 60, difficulty: 'medium', video_url: '' })
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [uploadingVideo, setUploadingVideo] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const [assignForm, setAssignForm] = useState({ exercise_name: '', reps_per_set: 10, sets: 3, notes: '' })
    const [assignVideoFile, setAssignVideoFile] = useState<File | null>(null)
    const [assignSource, setAssignSource] = useState<'upload' | 'library'>('upload')
    const [libraryExerciseId, setLibraryExerciseId] = useState<string | null>(null)
    const [assigning, setAssigning] = useState(false)

    const [dietPlanContent, setDietPlanContent] = useState('')
    const [savingDiet, setSavingDiet] = useState(false)

    useEffect(() => {
        (async () => {
            const current = await getCurrentUser()
            if (!current || current.role !== 'doctor') return router.push('/login')
            setUser(current)
            setLoading(false)
        })()
    }, [router])

    const fetchData = async () => {
        if (!user) return
        const [{ data: p }, { data: e }, { data: a }, { data: t }] = await Promise.all([
            supabase.from('users').select('*').eq('role', 'patient').eq('doctor_id', user.id),
            supabase.from('exercises').select('*'),
            supabase.from('patient_exercises').select('*'),
            supabase.from('exercise_templates').select('exercise_id, status, error_message'),
        ])
        setPatients(p || [])
        setExercises(e || [])
        setAssignments(a || [])
        setTemplates(Object.fromEntries((t || []).map(x => [x.exercise_id, { status: x.status, error_message: x.error_message }])))
    }

    useEffect(() => { fetchData() }, [user, activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleLogout = async () => { await signOut(); router.push('/login') }

    const uploadVideo = async (file: File) => {
        const name = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${file.name.split('.').pop()}`
        const { error } = await supabase.storage.from('exercise-videos').upload(name, file, { cacheControl: '3600', upsert: false })
        if (error) throw error
        return supabase.storage.from('exercise-videos').getPublicUrl(name).data.publicUrl
    }

    const addExercise = async () => {
        if (!newExercise.name) return
        try {
            let video_url = newExercise.video_url
            if (videoFile) {
                setUploadingVideo(true)
                setUploadProgress(30)
                video_url = await uploadVideo(videoFile)
                setUploadProgress(100)
            }
            const { error } = await supabase.from('exercises').insert([{ ...newExercise, video_url, created_by: user?.id }])
            if (error) throw error
            setShowAddExercise(false)
            setNewExercise({ name: '', description: '', duration_seconds: 60, difficulty: 'medium', video_url: '' })
            setVideoFile(null)
            toast.success('Exercise added')
            fetchData()
        } catch (err) {
            toast.error((err as Error).message || 'Failed to add exercise')
        } finally {
            setUploadingVideo(false)
            setUploadProgress(0)
        }
    }

    // Extracts the pose template from the uploaded video in the background so the doctor can keep working.
    const processVideoForTemplate = async (exerciseId: string, videoUrl: string) => {
        const video = document.createElement('video')
        Object.assign(video, { crossOrigin: 'anonymous', src: videoUrl, muted: true, playsInline: true, preload: 'auto' })
        video.style.cssText = 'position:absolute;left:-9999px;top:-9999px'
        document.body.appendChild(video)
        try {
            await new Promise<void>((resolve, reject) => {
                video.onloadeddata = () => resolve()
                video.onerror = () => reject(new Error('Failed to load video (CORS?)'))
                video.load()
            })
            const { extractTemplateFromVideo, saveTemplateToDatabase } = await import('@/lib/templateExtractor')
            const template = await extractTemplateFromVideo(video, 250)
            if (template?.phases.length) {
                await saveTemplateToDatabase(exerciseId, template)
                toast.success('Pose template ready')
            } else {
                throw new Error('No poses detected in video')
            }
        } catch (err) {
            await supabase.from('exercise_templates').update({ status: 'error', error_message: String(err) }).eq('exercise_id', exerciseId)
            toast.error('Template extraction failed')
        } finally {
            video.remove()
        }
    }

    const canAssign = assignSource === 'library' ? !!libraryExerciseId : !!assignForm.exercise_name && !!assignVideoFile

    const assignExercise = async () => {
        if (!selectedPatient || !canAssign) return
        setAssigning(true)
        try {
            let exerciseId = libraryExerciseId as string
            if (assignSource === 'upload') {
                const publicUrl = await uploadVideo(assignVideoFile!)
                const { data: ex, error: exErr } = await supabase
                    .from('exercises')
                    .insert([{ name: assignForm.exercise_name, description: assignForm.notes, video_url: publicUrl, created_by: user?.id }])
                    .select().single()
                if (exErr || !ex) throw exErr || new Error('Failed to create exercise')
                await supabase.from('exercise_templates').insert([{ exercise_id: ex.id, phases: [], status: 'processing' }])
                processVideoForTemplate(ex.id, publicUrl)
                exerciseId = ex.id
            }

            const { error } = await supabase.from('patient_exercises').insert([{
                patient_id: selectedPatient.id, exercise_id: exerciseId, assigned_by: user?.id,
                reps_per_set: assignForm.reps_per_set, sets: assignForm.sets, notes: assignForm.notes,
            }])
            if (error) throw error
            setShowAssignExercise(false)
            setSelectedPatient(null)
            setAssignForm({ exercise_name: '', reps_per_set: 10, sets: 3, notes: '' })
            setAssignVideoFile(null)
            setLibraryExerciseId(null)
            toast.success(assignSource === 'upload' ? 'Exercise assigned — template extracting in background' : 'Exercise assigned')
            fetchData()
        } catch (err) {
            toast.error((err as Error).message || 'Failed to assign exercise')
        } finally {
            setAssigning(false)
        }
    }

    const deleteExercise = async (id: string) => {
        if (!confirm('Delete this exercise? It will be removed from all assigned patients.')) return
        try {
            await supabase.from('patient_exercises').delete().eq('exercise_id', id)
            await supabase.from('exercise_templates').delete().eq('exercise_id', id)
            const { error } = await supabase.from('exercises').delete().eq('id', id)
            if (error) throw error
            setExercises(ex => ex.filter(e => e.id !== id))
            toast.success('Exercise deleted')
        } catch {
            toast.error('Failed to delete exercise')
        }
    }

    const retryTemplate = async (ex: Exercise) => {
        if (!ex.video_url) return toast.error('Exercise has no video')
        const { data: existing } = await supabase.from('exercise_templates').select('id').eq('exercise_id', ex.id).maybeSingle()
        if (existing) await supabase.from('exercise_templates').update({ status: 'processing', error_message: null, phases: [] }).eq('exercise_id', ex.id)
        else await supabase.from('exercise_templates').insert([{ exercise_id: ex.id, phases: [], status: 'processing' }])
        setTemplates(t => ({ ...t, [ex.id]: { status: 'processing' } }))
        toast.info('Extracting template…')
        await processVideoForTemplate(ex.id, ex.video_url)
        fetchData()
    }

    const removeAssignment = async (id: string) => {
        await supabase.from('patient_exercises').delete().eq('id', id)
        fetchData()
    }

    const openAddPatient = async () => {
        const { data } = await supabase.from('users').select('id, name, email, injury, age, phone').eq('role', 'patient').is('doctor_id', null).order('name')
        setUnassigned(data || [])
        setAddPatientId(null)
        setShowAddPatient(true)
    }

    const addPatient = async () => {
        if (!addPatientId || !user) return
        setAddingPatient(true)
        const { data, error } = await supabase.from('users').update({ doctor_id: user.id }).eq('id', addPatientId).select('id')
        setAddingPatient(false)
        if (error || !data?.length) return toast.error('Failed to add patient — check the users table UPDATE policy')
        setShowAddPatient(false)
        toast.success('Patient added')
        fetchData()
    }

    const removePatient = async (p: Patient) => {
        if (!confirm(`Remove ${p.name} from your patients? Their exercise assignments stay intact.`)) return
        const { data, error } = await supabase.from('users').update({ doctor_id: null }).eq('id', p.id).select('id')
        if (error || !data?.length) return toast.error('Failed to remove patient — check the users table UPDATE policy')
        toast.success('Patient removed')
        fetchData()
    }

    const saveDietPlan = async () => {
        if (!selectedPatient) return
        setSavingDiet(true)
        const { data, error } = await supabase.from('users').update({ diet_plan: dietPlanContent }).eq('id', selectedPatient.id).select('id')
        setSavingDiet(false)
        if (error || !data?.length) return toast.error('Failed to save diet plan — check the users table UPDATE policy')
        setShowAssignDiet(false)
        setDietPlanContent('')
        setSelectedPatient(null)
        toast.success('Diet plan saved')
        fetchData()
    }

    if (loading) {
        return <div className="flex min-h-dvh items-center justify-center bg-background"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
    }

    const menu: MenuItem[] = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, onClick: () => setActiveTab('dashboard') },
        { id: 'patients', label: 'Patients', icon: Users, onClick: () => setActiveTab('patients') },
        { id: 'exercises', label: 'Exercise library', icon: Dumbbell, onClick: () => setActiveTab('exercises') },
        { id: 'reports', label: 'Reports', icon: BarChart, onClick: () => setActiveTab('reports') },
    ]
    const titles: Record<Tab, string> = { dashboard: 'Dashboard', patients: 'Patients', exercises: 'Exercise library', reports: 'Reports' }
    const patientAssignments = (id: string) => assignments.filter(a => a.patient_id === id)
    const exerciseName = (id: string) => exercises.find(e => e.id === id)?.name || 'Unknown'
    const difficultyVariant = (d: string) => (d === 'easy' ? 'secondary' : d === 'hard' ? 'destructive' : 'outline') as 'secondary' | 'destructive' | 'outline'

    return (
        <AppShell user={user} onLogout={handleLogout} title={titles[activeTab]} items={menu} activeTab={activeTab}>
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h2>
                        <p className="text-sm text-muted-foreground">Here&apos;s an overview of your practice.</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        {[
                            { label: 'Patients', value: patients.length, icon: Users },
                            { label: 'Exercises', value: exercises.length, icon: Dumbbell },
                            { label: 'Assignments', value: assignments.length, icon: ClipboardList },
                        ].map(s => (
                            <Card key={s.label}>
                                <CardHeader>
                                    <CardDescription className="flex items-center gap-2"><s.icon className="size-4" />{s.label}</CardDescription>
                                    <CardTitle className="text-3xl tabular-nums">{s.value}</CardTitle>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick actions</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <Button variant="outline" className="justify-start" onClick={() => { setActiveTab('exercises'); setShowAddExercise(true) }}><Plus /> Add exercise to library</Button>
                                <Button variant="outline" className="justify-start" onClick={() => setActiveTab('patients')}><Users /> Manage patients</Button>
                                <Button variant="outline" className="justify-start" onClick={() => setActiveTab('reports')}><BarChart /> View reports</Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Recent patients</CardTitle>
                                <CardAction><Button variant="link" size="sm" onClick={() => setActiveTab('patients')}>View all</Button></CardAction>
                            </CardHeader>
                            <CardContent>
                                {patients.length ? (
                                    <ul className="divide-y">
                                        {patients.slice(0, 4).map(p => (
                                            <li key={p.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                                                <Avatar className="size-8"><AvatarFallback className="text-xs">{initials(p.name)}</AvatarFallback></Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">{p.name}</p>
                                                    <p className="truncate text-xs text-muted-foreground">{p.injury || 'General recovery'}</p>
                                                </div>
                                                <span className="text-xs text-muted-foreground">{patientAssignments(p.id).length} exercises</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="py-6 text-center text-sm text-muted-foreground">No patients assigned to you yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'patients' && (
                <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{patients.length} patient{patients.length === 1 ? '' : 's'}</p>
                    <Button onClick={openAddPatient}><UserPlus /> Get patient assigned</Button>
                </div>
                {patients.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center py-12 text-center">
                            <Users className="mb-3 size-8 text-muted-foreground" />
                            <p className="text-sm font-medium">No patients yet</p>
                            <p className="mt-1 mb-4 text-sm text-muted-foreground">Add a registered patient to start assigning exercises.</p>
                            <Button onClick={openAddPatient}><UserPlus /> Get patient assigned</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {patients.map(p => {
                            const pa = patientAssignments(p.id)
                            return (
                                <Card key={p.id}>
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-10"><AvatarFallback>{initials(p.name)}</AvatarFallback></Avatar>
                                            <div className="min-w-0">
                                                <CardTitle className="truncate">{p.name}</CardTitle>
                                                <CardDescription className="truncate">{p.email}</CardDescription>
                                            </div>
                                        </div>
                                        <CardAction>
                                            <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => removePatient(p)} aria-label="Remove patient"><UserMinus /></Button>
                                        </CardAction>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            <Badge variant="outline">{p.injury || 'General recovery'}</Badge>
                                            {p.age && <Badge variant="secondary">Age {p.age}</Badge>}
                                            {p.phone && <Badge variant="secondary"><Phone />{p.phone}</Badge>}
                                        </div>
                                        <div>
                                            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{pa.length} assigned exercise{pa.length === 1 ? '' : 's'}</p>
                                            {pa.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {pa.slice(0, 3).map(a => (
                                                        <Badge key={a.id} variant="secondary" className="gap-1 pr-1">
                                                            {exerciseName(a.exercise_id)}
                                                            <button type="button" onClick={() => removeAssignment(a.id)} className="rounded-sm hover:text-destructive" aria-label="Remove"><X className="size-3" /></button>
                                                        </Badge>
                                                    ))}
                                                    {pa.length > 3 && (
                                                        <Button variant="ghost" size="xs" onClick={() => { setSelectedPatient(p); setShowAllAssignments(true) }}>+{pa.length - 3} more</Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <Button size="sm" onClick={() => { setSelectedPatient(p); setShowAssignExercise(true) }}><Dumbbell /> Assign</Button>
                                            <Button size="sm" variant="outline" onClick={() => { setSelectedPatient(p); setDietPlanContent(p.diet_plan || ''); setShowAssignDiet(true) }}><Utensils /> {p.diet_plan ? 'Edit diet' : 'Diet'}</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
                </div>
            )}

            {activeTab === 'exercises' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{exercises.length} exercise{exercises.length === 1 ? '' : 's'} in library</p>
                        <Button onClick={() => setShowAddExercise(true)}><Plus /> Add exercise</Button>
                    </div>
                    {exercises.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center py-12 text-center">
                                <Dumbbell className="mb-3 size-8 text-muted-foreground" />
                                <p className="text-sm font-medium">No exercises yet</p>
                                <p className="mt-1 mb-4 text-sm text-muted-foreground">Upload a demo video to create your first exercise.</p>
                                <Button onClick={() => setShowAddExercise(true)}><Plus /> Add exercise</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {exercises.map(ex => (
                                <Card key={ex.id} className="overflow-hidden pt-0">
                                    <div className="aspect-video bg-muted">
                                        {ex.video_url ? (
                                            <video src={ex.video_url} className="size-full object-cover" controls preload="metadata" />
                                        ) : (
                                            <div className="flex size-full items-center justify-center text-muted-foreground"><Dumbbell className="size-8" /></div>
                                        )}
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="truncate">{ex.name}</CardTitle>
                                        <CardDescription className="line-clamp-2">{ex.description || 'No description'}</CardDescription>
                                        <CardAction>
                                            <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => deleteExercise(ex.id)} aria-label="Delete exercise"><Trash2 /></Button>
                                        </CardAction>
                                    </CardHeader>
                                    <CardContent className="flex flex-wrap items-center gap-2">
                                        <Badge variant={difficultyVariant(ex.difficulty)} className="capitalize">{ex.difficulty}</Badge>
                                        {ex.duration_seconds && <span className="text-xs text-muted-foreground">{ex.duration_seconds}s</span>}
                                        {(() => {
                                            const t = templates[ex.id]
                                            if (t?.status === 'ready') return <Badge variant="secondary" className="text-success">Template ready</Badge>
                                            if (t?.status === 'processing') return <Badge variant="secondary"><Loader2 className="animate-spin" />Extracting</Badge>
                                            return (
                                                <Button variant="outline" size="xs" className="ml-auto" title={t?.error_message} onClick={() => retryTemplate(ex)}>
                                                    <RotateCw /> {t?.status === 'error' ? 'Retry template' : 'Extract template'}
                                                </Button>
                                            )
                                        })()}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'reports' && <DoctorReports patients={patients} assignments={assignments} exercises={exercises} />}

            {/* Add exercise */}
            <Dialog open={showAddExercise} onOpenChange={setShowAddExercise}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add exercise</DialogTitle>
                        <DialogDescription>Add a reusable exercise to your library.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="ex-name">Name</Label>
                            <Input id="ex-name" placeholder="e.g. Shoulder rotation" value={newExercise.name} onChange={e => setNewExercise({ ...newExercise, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ex-desc">Description</Label>
                            <Textarea id="ex-desc" rows={3} placeholder="Describe the exercise…" value={newExercise.description} onChange={e => setNewExercise({ ...newExercise, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="ex-dur">Duration (s)</Label>
                                <Input id="ex-dur" type="number" min={1} value={newExercise.duration_seconds} onChange={e => setNewExercise({ ...newExercise, duration_seconds: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Difficulty</Label>
                                <Select value={newExercise.difficulty} onValueChange={v => setNewExercise({ ...newExercise, difficulty: v as string })}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Demo video</Label>
                            <FilePicker id="video-upload" file={videoFile} onChange={setVideoFile} />
                        </div>
                        {uploadingVideo && <Progress value={uploadProgress} />}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddExercise(false)}>Cancel</Button>
                        <Button onClick={addExercise} disabled={uploadingVideo || !newExercise.name}>
                            {uploadingVideo && <Loader2 className="animate-spin" />}
                            {uploadingVideo ? 'Uploading…' : 'Add exercise'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign exercise */}
            <Dialog open={showAssignExercise && !!selectedPatient} onOpenChange={o => { setShowAssignExercise(o); if (!o) setSelectedPatient(null) }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign exercise</DialogTitle>
                        <DialogDescription>To {selectedPatient?.name}. Upload a demo video — the pose template is extracted automatically.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Tabs value={assignSource} onValueChange={v => setAssignSource(v as typeof assignSource)}>
                            <TabsList className="w-full">
                                <TabsTrigger value="upload" className="flex-1">Upload video</TabsTrigger>
                                <TabsTrigger value="library" className="flex-1">From library</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        {assignSource === 'upload' ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="as-name">Exercise name</Label>
                                    <Input id="as-name" placeholder="e.g. Knee stretch" value={assignForm.exercise_name} onChange={e => setAssignForm({ ...assignForm, exercise_name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Demo video</Label>
                                    <FilePicker id="assign-video-upload" file={assignVideoFile} onChange={setAssignVideoFile} />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label>Exercise</Label>
                                {exercises.length ? (
                                    <Select value={libraryExerciseId} onValueChange={v => setLibraryExerciseId(v as string)} items={Object.fromEntries(exercises.map(e => [e.id, e.name]))}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select an exercise…" /></SelectTrigger>
                                        <SelectContent>{exercises.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Library is empty — add an exercise first.</p>
                                )}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="as-sets">Sets</Label>
                                <Input id="as-sets" type="number" min={1} value={assignForm.sets} onChange={e => setAssignForm({ ...assignForm, sets: Math.max(1, parseInt(e.target.value) || 1) })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="as-reps">Reps per set</Label>
                                <Input id="as-reps" type="number" min={1} value={assignForm.reps_per_set} onChange={e => setAssignForm({ ...assignForm, reps_per_set: Math.max(1, parseInt(e.target.value) || 1) })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="as-notes">Notes</Label>
                            <Textarea id="as-notes" rows={2} placeholder="Any special instructions…" value={assignForm.notes} onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowAssignExercise(false); setSelectedPatient(null) }}>Cancel</Button>
                        <Button onClick={assignExercise} disabled={assigning || !canAssign}>
                            {assigning && <Loader2 className="animate-spin" />}
                            {assigning ? 'Uploading…' : 'Assign'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diet plan */}
            <Dialog open={showAssignDiet} onOpenChange={setShowAssignDiet}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Diet plan</DialogTitle>
                        <DialogDescription>For {selectedPatient?.name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="diet">Plan</Label>
                            <Button variant="link" size="xs" onClick={() => setDietPlanContent(INDIAN_DIET_TEMPLATE)}><Flame /> Use Indian diet template</Button>
                        </div>
                        <Textarea id="diet" rows={12} placeholder="Enter breakfast, lunch, dinner details…" value={dietPlanContent} onChange={e => setDietPlanContent(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAssignDiet(false)}>Cancel</Button>
                        <Button onClick={saveDietPlan} disabled={savingDiet}>
                            {savingDiet && <Loader2 className="animate-spin" />}
                            {savingDiet ? 'Saving…' : 'Save diet plan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add patient */}
            <Dialog open={showAddPatient} onOpenChange={setShowAddPatient}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Get patient assigned</DialogTitle>
                        <DialogDescription>Choose a registered patient who doesn&apos;t have a doctor yet.</DialogDescription>
                    </DialogHeader>
                    {unassigned.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">No unassigned patients. Ask them to sign up first.</p>
                    ) : (
                        <div className="space-y-2">
                            <Label>Patient</Label>
                            <Select value={addPatientId} onValueChange={v => setAddPatientId(v as string)} items={Object.fromEntries(unassigned.map(p => [p.id, `${p.name} · ${p.email}`]))}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select a patient…" /></SelectTrigger>
                                <SelectContent>
                                    {unassigned.map(p => <SelectItem key={p.id} value={p.id}>{p.name} · {p.email}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddPatient(false)}>Cancel</Button>
                        <Button onClick={addPatient} disabled={!addPatientId || addingPatient}>
                            {addingPatient && <Loader2 className="animate-spin" />} Assign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* All assignments */}
            <Dialog open={showAllAssignments && !!selectedPatient} onOpenChange={o => { setShowAllAssignments(o); if (!o) setSelectedPatient(null) }}>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Assigned exercises</DialogTitle>
                        <DialogDescription>{selectedPatient?.name}</DialogDescription>
                    </DialogHeader>
                    <ul className="divide-y">
                        {selectedPatient && patientAssignments(selectedPatient.id).map(a => {
                            const ex = exercises.find(e => e.id === a.exercise_id)
                            if (!ex) return null
                            return (
                                <li key={a.id} className="flex items-center gap-3 py-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{ex.name}</p>
                                        <p className="text-xs text-muted-foreground">{a.sets} sets · {a.reps_per_set} reps{a.notes ? ` · ${a.notes}` : ''}</p>
                                    </div>
                                    <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => removeAssignment(a.id)} aria-label="Remove assignment"><X /></Button>
                                </li>
                            )
                        })}
                    </ul>
                </DialogContent>
            </Dialog>
        </AppShell>
    )
}
