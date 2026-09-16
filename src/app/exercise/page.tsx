'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut, User } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import AppShell from '../components/AppShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Square } from 'lucide-react'

interface Exercise { id: string; name: string; description: string; duration_seconds: number; difficulty: string; video_url: string }
interface PatientExercise { id: string; exercise_id: string; reps_per_set: number; sets: number; notes: string; status: string; completed?: boolean; completed_at?: string; exercise?: Exercise }

export default function ExercisePage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [assignments, setAssignments] = useState<PatientExercise[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [sessionStarted, setSessionStarted] = useState(false)
    const [isInitializing, setIsInitializing] = useState(false)
    const [error, setError] = useState('')
    const [repCount, setRepCount] = useState(0)
    const [currentSet, setCurrentSet] = useState(1)
    const [setCompleteMessage, setSetCompleteMessage] = useState('')
    const [exerciseCompleted, setExerciseCompleted] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const referenceVideoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const poseEngineRef = useRef<any>(null)
    const animationRef = useRef<number | null>(null)
    const repCountRef = useRef(0)

    useEffect(() => { repCountRef.current = repCount }, [repCount])

    useEffect(() => {
        checkAuth()
        return () => { stopSession() }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { if (user) fetchAssignments() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

    // Advance sets; stop and mark complete after the last set.
    useEffect(() => {
        if (!sessionStarted || repCount <= 0) return
        const targetReps = assignments[currentIndex]?.reps_per_set || 10
        const totalSets = assignments[currentIndex]?.sets || 3
        if (repCount < targetReps) return
        if (currentSet < totalSets) {
            setSetCompleteMessage(`Set ${currentSet} complete`)
            setTimeout(() => { setCurrentSet(s => s + 1); setRepCount(0); setSetCompleteMessage('') }, 2000)
        } else {
            setExerciseCompleted(true)
            setSetCompleteMessage(`All ${totalSets} sets complete`)
            markExerciseComplete()
            setTimeout(() => stopSession(), 3000)
        }
    }, [repCount, sessionStarted, currentIndex, assignments, currentSet]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        let mounted = true
        let renderer: any = null
        let animationId: number
        let exerciseTemplate: any = null
        let phaseSequence: string[] = []
        let lastPhase: string = ''

        const initEngine = async () => {
            const videoEl = videoRef.current
            const canvasEl = canvasRef.current
            const stream = streamRef.current

            if (!sessionStarted || !videoEl || !canvasEl || !stream) return

            try {
                const { PoseEngine } = await import('@/pose-detection/poseEngine')
                const { PoseRenderer } = await import('@/pose-detection/poseRenderer.js')
                const { loadTemplateFromDatabase, extractAngles, matchPoseToPhase } = await import('@/lib/templateExtractor')

                if (!mounted) return

                videoEl.srcObject = stream
                await videoEl.play()

                poseEngineRef.current = new PoseEngine(videoEl)

                // Use Lightning on mobile (smaller, faster to download)
                const isMobile = window.innerWidth < 768 || 'ontouchstart' in window
                console.log(`Device type: ${isMobile ? 'Mobile' : 'Desktop'}, using ${isMobile ? 'Lightning' : 'Thunder'} model`)
                // ponytail: 90s cap so a stalled model download surfaces as an error instead of an infinite spinner
                await Promise.race([
                    poseEngineRef.current.init(isMobile),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('Model download timed out — check your internet connection and try again')), 90000)),
                ])

                // Load template from database
                const currentExercise = assignments[currentIndex]?.exercise
                console.log('Current exercise:', currentExercise?.id, currentExercise?.name)

                if (currentExercise?.id) {
                    console.log('Loading template for exercise ID:', currentExercise.id)
                    exerciseTemplate = await loadTemplateFromDatabase(currentExercise.id)

                    if (exerciseTemplate && exerciseTemplate.phases.length > 0) {
                        console.log('✅ TEMPLATE LOADED SUCCESSFULLY!')
                        console.log('Phases:', JSON.stringify(exerciseTemplate.phases, null, 2))
                        console.log('Rep sequence:', exerciseTemplate.repSequence)
                        console.log('Tolerance:', exerciseTemplate.toleranceDegrees, 'degrees')
                    } else {
                        console.warn('⚠️ NO TEMPLATE FOUND - using fallback (visibility-based) counting')
                    }
                } else {
                    console.warn('No exercise ID available')
                }

                // Reference video setup (for visual guide only)
                if (referenceVideoRef.current && currentExercise?.video_url) {
                    referenceVideoRef.current.src = currentExercise.video_url
                    referenceVideoRef.current.load()
                    referenceVideoRef.current.play().catch(() => { })
                }

                if (!mounted) return

                if (!canvasEl || typeof canvasEl.getContext !== 'function') {
                    setError('Graphics error: Canvas not found. Please refresh the page.')
                    return
                }

                renderer = new PoseRenderer(canvasEl)

                if (containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect()
                    renderer.resize(rect.width, rect.height)
                }

                // ponytail: 5 frames ≈ 150-250ms at webcam rates; raise if flicker still counts reps
                const HOLD_FRAMES = 5
                let candidatePhase = ''
                let candidateFrames = 0
                let repCounted = false
                const targetReps = assignments[currentIndex]?.reps_per_set || 10

                const detect = async () => {
                    if (!mounted || !poseEngineRef.current) return

                    try {
                        const userPoses = await poseEngineRef.current.estimate()

                        if (userPoses?.length) {
                            const userPose = userPoses[0]

                            if (containerRef.current && videoEl && canvasEl) {
                                const container = containerRef.current.getBoundingClientRect()

                                if (renderer.displayWidth !== container.width || renderer.displayHeight !== container.height) {
                                    renderer.resize(container.width, container.height)
                                }

                                const video = {
                                    width: videoEl.videoWidth || 640,
                                    height: videoEl.videoHeight || 480
                                }

                                const scale = Math.max(container.width / video.width, container.height / video.height)
                                const displayedWidth = video.width * scale
                                const displayedHeight = video.height * scale
                                const offsetX = (displayedWidth - container.width) / 2
                                const offsetY = (displayedHeight - container.height) / 2

                                const scaledKeypoints = userPose.keypoints.map((kp: any) => ({
                                    ...kp,
                                    x: kp.x * scale - offsetX,
                                    y: kp.y * scale - offsetY
                                }))

                                // Check if user is visible
                                const goodKeypoints = userPose.keypoints.filter(
                                    (kp: any) => kp.score >= 0.3
                                ).length
                                const isVisible = goodKeypoints >= 8

                                let isCorrect = false
                                let currentPhase = ''

                                // TEMPLATE-BASED COMPARISON
                                if (exerciseTemplate && exerciseTemplate.phases.length > 0) {
                                    // Convert keypoints to landmark map
                                    const landmarks: Record<string, any> = {}
                                    for (const kp of userPose.keypoints) {
                                        if (kp.name) {
                                            landmarks[kp.name] = {
                                                x: kp.x / video.width,
                                                y: kp.y / video.height,
                                                visibility: kp.score
                                            }
                                        }
                                    }

                                    // Extract user's angles
                                    const userAngles = extractAngles(landmarks)

                                    // Match to template phase
                                    const match = matchPoseToPhase(userAngles, exerciseTemplate)
                                    isCorrect = match.isMatch
                                    // Only a real match counts as being "in" a phase; the closest-but-wrong phase must not.
                                    const matchedPhase = match.isMatch ? match.phase || '' : ''
                                    // Debounce: the pose must be held for HOLD_FRAMES consecutive frames before it registers.
                                    if (matchedPhase && matchedPhase === candidatePhase) {
                                        candidateFrames++
                                    } else {
                                        candidatePhase = matchedPhase
                                        candidateFrames = matchedPhase ? 1 : 0
                                    }
                                    currentPhase = candidateFrames >= HOLD_FRAMES ? candidatePhase : lastPhase

                                    // Track phase sequence for rep counting
                                    if (currentPhase && currentPhase !== lastPhase) {
                                        phaseSequence.push(currentPhase)
                                        lastPhase = currentPhase

                                        // Safety: clear if too long to prevent stale data
                                        if (phaseSequence.length > 20) {
                                            phaseSequence = phaseSequence.slice(-5)
                                        }

                                        // Check if rep sequence is complete
                                        const repSeq = exerciseTemplate.repSequence || ['start', 'peak', 'start']
                                        if (phaseSequence.length >= repSeq.length) {
                                            const tail = phaseSequence.slice(-repSeq.length)
                                            if (JSON.stringify(tail) === JSON.stringify(repSeq)) {
                                                // Rep completed!
                                                const currentRepCount = repCountRef.current
                                                if (!repCounted && currentRepCount < targetReps) {
                                                    setRepCount(prev => prev + 1)
                                                    repCounted = true
                                                    if (renderer) renderer.triggerCelebration()

                                                    // Voice feedback for rep completion
                                                    try {
                                                        const { sayRepComplete } = await import('@/lib/voiceFeedback')
                                                        sayRepComplete(currentRepCount + 1, targetReps)
                                                    } catch (e) { /* Voice not supported */ }

                                                    setTimeout(() => {
                                                        repCounted = false

                                                        // Check if this was the last rep of the set
                                                        if (currentRepCount + 1 >= targetReps) {
                                                            phaseSequence = [] // Clear sequence for next set
                                                        } else {
                                                            // Keep the last phase (usually 'start') to anchor the next rep
                                                            phaseSequence = [lastPhase]
                                                        }
                                                    }, 800)
                                                }
                                            }
                                        }
                                    }

                                    // Debug log periodically
                                    if (Math.random() < 0.02) {
                                        console.log('Phase:', currentPhase, 'Match:', match.similarity.toFixed(2))
                                    }
                                } else {
                                    // No template available - DON'T count reps automatically
                                    // Just show the skeleton but no automatic counting
                                    isCorrect = isVisible

                                    // Log warning periodically
                                    if (Math.random() < 0.01) {
                                        console.warn('⚠️ No template - rep counting disabled. Please ensure template was saved.')
                                    }
                                    // DO NOT count reps when no template exists
                                }

                                if (renderer) {
                                    renderer.renderSimple(scaledKeypoints, isCorrect)
                                }
                            }
                        }
                    } catch (err) { }

                    animationId = requestAnimationFrame(detect)
                }

                detect()
                setIsInitializing(false)

            } catch (err: any) {
                setError(`AI Initialization failed: ${err.message || 'Unknown error'}`)
                stopSession()
            }
        }

        if (sessionStarted) {
            const timer = setTimeout(initEngine, 800)
            return () => {
                mounted = false
                clearTimeout(timer)
                if (animationId) cancelAnimationFrame(animationId)
            }
        }
    }, [sessionStarted, assignments, currentIndex])


    const checkAuth = async () => {
        const current = await getCurrentUser()
        if (!current || current.role !== 'patient') return router.push('/login')
        setUser(current)
        setLoading(false)
    }

    const fetchAssignments = async () => {
        if (!user) return
        const { data } = await supabase.from('patient_exercises').select('*, exercise:exercises(*)').eq('patient_id', user.id)
        setAssignments(data || [])
    }

    const handleLogout = async () => { stopSession(); await signOut(); router.push('/login') }

    const markExerciseComplete = async () => {
        const a = assignments[currentIndex]
        if (!a) return
        await supabase.from('patient_exercises').update({ completed: true, status: 'completed', completed_at: new Date().toISOString() }).eq('id', a.id)
        fetchAssignments()
    }

    const startSession = async (index?: number) => {
        if (typeof index === 'number') setCurrentIndex(index)
        setRepCount(0)
        setCurrentSet(1)
        setSetCompleteMessage('')
        setExerciseCompleted(false)
        setError('')
        setIsInitializing(true)
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false })
            setSessionStarted(true)
        } catch {
            setError('Please allow camera access to start the exercise.')
            setIsInitializing(false)
        }
    }

    const stopSession = async () => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = null }
        if (poseEngineRef.current) {
            try { await poseEngineRef.current.dispose() } catch { }
            poseEngineRef.current = null
        }
        setSessionStarted(false)
        setRepCount(0)
    }

    const goTo = (index: number) => {
        if (index < 0 || index >= assignments.length) return
        stopSession()
        setCurrentIndex(index)
        setTimeout(() => startSession(index), 100)
    }

    if (loading) {
        return <div className="flex min-h-dvh items-center justify-center bg-background"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
    }

    const current = assignments[currentIndex]
    const targetReps = current?.reps_per_set || 10
    const totalSets = current?.sets || 3
    const goalReached = repCount >= targetReps

    if (sessionStarted) {
        return (
            <div ref={containerRef} className="fixed inset-0 z-50 bg-black text-white">
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 size-full -scale-x-100 object-cover" />
                <canvas ref={canvasRef} className="absolute inset-0 size-full -scale-x-100" />

                {isInitializing && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/80 backdrop-blur-sm">
                        <Loader2 className="size-8 animate-spin" />
                        <p className="text-sm text-white/70">Loading pose model…</p>
                    </div>
                )}

                {/* Demo video */}
                <div className="absolute top-3 right-3 w-36 overflow-hidden rounded-lg border border-white/15 bg-black/60 backdrop-blur sm:top-4 sm:right-4 sm:w-56 md:w-72">
                    <video ref={referenceVideoRef} loop muted playsInline crossOrigin="anonymous" className="aspect-video w-full object-contain" />
                    <p className="px-2 py-1 text-center text-xs text-white/70">Demo · {current?.exercise?.name}</p>
                </div>

                {/* Rep counter */}
                <div className="absolute top-3 left-3 rounded-lg border border-white/15 bg-black/60 px-4 py-3 text-center backdrop-blur sm:top-4 sm:left-4 sm:px-6 sm:py-4">
                    <p className="text-xs text-white/70">Set {currentSet} / {totalSets}</p>
                    <p className={cn('text-5xl font-semibold tabular-nums sm:text-6xl', goalReached && 'text-success')}>{repCount}</p>
                    <p className="text-xs text-white/70">of {targetReps} reps</p>
                </div>

                {setCompleteMessage && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2 rounded-xl border border-white/15 bg-black/80 px-8 py-6 text-center">
                            <CheckCircle2 className={cn('size-8', exerciseCompleted ? 'text-success' : 'text-white')} />
                            <p className="text-2xl font-semibold">{setCompleteMessage}</p>
                            <p className="text-sm text-white/70">{exerciseCompleted ? 'Exercise complete' : `Preparing set ${currentSet + 1}…`}</p>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 sm:bottom-8">
                    <Button variant="secondary" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}><ChevronLeft /> Prev</Button>
                    <Button variant="destructive" onClick={stopSession}><Square /> Stop</Button>
                    <Button
                        variant={goalReached ? 'default' : 'secondary'}
                        onClick={() => (currentIndex === assignments.length - 1 ? stopSession() : goTo(currentIndex + 1))}
                        disabled={currentIndex === assignments.length - 1 && !goalReached}
                    >
                        {currentIndex === assignments.length - 1 ? 'Finish' : 'Next'} <ChevronRight />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <AppShell user={user} onLogout={handleLogout} title="Exercise">
            <div className="space-y-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Your exercises</h2>
                    <p className="text-sm text-muted-foreground">Start a session to track reps with your camera.</p>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {assignments.length ? (
                    <div className="grid gap-3">
                        {assignments.map((a, i) => {
                            const done = a.completed || a.status === 'completed'
                            return (
                                <Card key={a.id}>
                                    <CardContent className="flex items-center gap-4">
                                        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold', done ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}>
                                            {done ? <CheckCircle2 className="size-5" /> : i + 1}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium">{a.exercise?.name}</p>
                                            <p className="text-sm text-muted-foreground">{a.sets} sets · {a.reps_per_set} reps{a.notes ? ` · ${a.notes}` : ''}</p>
                                        </div>
                                        <Badge variant={done ? 'secondary' : 'outline'} className="hidden sm:inline-flex">{done ? 'Completed' : 'Pending'}</Badge>
                                        <Button variant={done ? 'outline' : 'default'} onClick={() => startSession(i)}>{done ? 'Redo' : 'Start'}</Button>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center text-sm text-muted-foreground">No exercises assigned yet.</CardContent>
                    </Card>
                )}
            </div>
        </AppShell>
    )
}
