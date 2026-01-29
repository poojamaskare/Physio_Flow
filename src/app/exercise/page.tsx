'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut, User } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Sidebar from '../components/Sidebar'

interface Exercise {
    id: string
    name: string
    description: string
    duration_seconds: number
    difficulty: string
    video_url: string
}

interface PatientExercise {
    id: string
    exercise_id: string
    reps_per_set: number
    sets: number
    notes: string
    status: string
    exercise?: Exercise
}

export default function ExercisePage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [assignments, setAssignments] = useState<PatientExercise[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [sessionStarted, setSessionStarted] = useState(false)
    const [sessionLoading, setSessionLoading] = useState(false)
    const [isInitializing, setIsInitializing] = useState(false)
    const [error, setError] = useState('')
    const [repCount, setRepCount] = useState(0)

    const containerRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const referenceVideoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const poseEngineRef = useRef<any>(null)
    const referencePoseEngineRef = useRef<any>(null)
    const animationRef = useRef<number | null>(null)

    useEffect(() => {
        checkAuth()
        return () => {
            stopSession()
        }
    }, [])

    useEffect(() => {
        if (user) {
            fetchAssignments()
        }
    }, [user])

    // Auto-stop session when goal is reached
    useEffect(() => {
        if (sessionStarted && repCount > 0) {
            const targetReps = assignments[currentIndex]?.reps_per_set || 10
            if (repCount >= targetReps) {
                // Delay a bit to show celebration, then stop
                const timer = setTimeout(() => {
                    stopSession()
                }, 2000)
                return () => clearTimeout(timer)
            }
        }
    }, [repCount, sessionStarted, currentIndex, assignments])

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
                await poseEngineRef.current.init()

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
                    try {
                        await referenceVideoRef.current.play()
                    } catch (e) { }
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

                let poseHoldFrames = 0
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
                                    currentPhase = match.phase || ''

                                    // Track phase sequence for rep counting
                                    if (currentPhase && currentPhase !== lastPhase) {
                                        phaseSequence.push(currentPhase)
                                        lastPhase = currentPhase

                                        // Check if rep sequence is complete
                                        const repSeq = exerciseTemplate.repSequence || ['start', 'peak', 'start']
                                        if (phaseSequence.length >= repSeq.length) {
                                            const tail = phaseSequence.slice(-repSeq.length)
                                            if (JSON.stringify(tail) === JSON.stringify(repSeq)) {
                                                // Rep completed!
                                                if (!repCounted && repCount < targetReps) {
                                                    setRepCount(prev => prev + 1)
                                                    repCounted = true
                                                    if (renderer) renderer.triggerCelebration()

                                                    setTimeout(() => {
                                                        repCounted = false
                                                        phaseSequence = []
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
        const currentUser = await getCurrentUser()
        if (!currentUser || currentUser.role !== 'patient') {
            router.push('/login')
            return
        }
        setUser(currentUser)
        setLoading(false)
    }

    const fetchAssignments = async () => {
        if (!user) return

        const { data } = await supabase
            .from('patient_exercises')
            .select(`
                *,
                exercise:exercises(*)
            `)
            .eq('patient_id', user.id)

        setAssignments(data || [])
    }

    const handleLogout = async () => {
        stopSession()
        await signOut()
        router.push('/login')
    }

    const currentExercise = assignments[currentIndex]?.exercise

    const startSession = async (index?: number) => {
        if (typeof index === 'number') {
            setCurrentIndex(index)
        }

        setSessionLoading(true)
        setError('')
        setIsInitializing(true)

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: false
            })

            streamRef.current = stream
            setSessionStarted(true)
            setSessionLoading(false)

        } catch (err: any) {
            setError('Please allow camera access to start the exercise.')
            setSessionLoading(false)
            setIsInitializing(false)
        }
    }

    const stopSession = async () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
            animationRef.current = null
        }
        if (poseEngineRef.current) {
            try { await poseEngineRef.current.dispose() } catch (e) { }
            poseEngineRef.current = null
        }
        if (referencePoseEngineRef.current) {
            try { await referencePoseEngineRef.current.dispose() } catch (e) { }
            referencePoseEngineRef.current = null
        }
        setSessionStarted(false)
        setRepCount(0)
    }

    const nextExercise = () => {
        if (currentIndex < assignments.length - 1) {
            stopSession()
            setCurrentIndex(prev => prev + 1)
            // Re-start session automatically for next exercise
            setTimeout(() => startSession(currentIndex + 1), 100)
        }
    }

    const prevExercise = () => {
        if (currentIndex > 0) {
            stopSession()
            setCurrentIndex(prev => prev - 1)
            setTimeout(() => startSession(currentIndex - 1), 100)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500"></div>
            </div>
        )
    }

    const currentTarget = assignments[currentIndex]?.reps_per_set || 10

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-500 font-sans" ref={containerRef}>
            {sessionStarted ? (
                <div className="fixed inset-0 bg-black z-50">
                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full -scale-x-100" />

                    {isInitializing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-500 mb-4"></div>
                            <p className="text-cyan-400 font-bold tracking-widest animate-pulse">BOOTING AI ENGINE...</p>
                        </div>
                    )}

                    <div className="absolute top-4 right-4 w-64 bg-slate-800/90 rounded-xl overflow-hidden border border-white/10">
                        <video
                            ref={referenceVideoRef}
                            loop
                            muted
                            playsInline
                            crossOrigin="anonymous"
                            className="w-full aspect-video object-contain bg-black"
                        />
                        <div className="p-3">
                            <p className="text-xs text-slate-400">Exercise Demo</p>
                            <p className="text-sm font-semibold">{currentExercise?.name}</p>
                        </div>
                    </div>

                    <div className="absolute top-4 left-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/50 rounded-2xl p-6 text-center shadow-2xl dark:shadow-emerald-500/20 z-10 transition-all">
                        <p className="text-xs font-black text-emerald-400 tracking-[0.2em] mb-1">REPS</p>
                        <p className="text-6xl font-black text-slate-900 dark:text-white">{repCount}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Goal: {currentTarget}</p>
                        {repCount >= currentTarget && (
                            <div className="mt-4 py-2 px-3 bg-emerald-500 text-slate-900 rounded-lg font-black text-xs animate-bounce">
                                GOAL REACHED! 🎉
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4">
                        <button onClick={prevExercise} disabled={currentIndex === 0} className="px-6 py-3 bg-slate-800/80 text-white rounded-xl disabled:opacity-30 hover:bg-slate-700">Previous</button>
                        <button onClick={stopSession} className="px-8 py-3 bg-red-500/80 text-white rounded-xl font-bold hover:bg-red-600">STOP</button>
                        <button
                            onClick={nextExercise}
                            disabled={currentIndex === assignments.length - 1 && repCount < currentTarget}
                            className={`px-6 py-3 rounded-xl transition-all ${repCount >= currentTarget
                                ? 'bg-emerald-500 text-slate-900 font-bold scale-110 shadow-lg shadow-emerald-500/30'
                                : 'bg-slate-800/80 text-white disabled:opacity-30'
                                }`}
                        >
                            {currentIndex === assignments.length - 1 ? 'Finish' : 'Next Exercise →'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex bg-slate-50 dark:bg-slate-900 min-h-screen">
                    <Sidebar user={user} onLogout={handleLogout} />
                    <main className="ml-64 p-8 w-full">
                        <h1 className="text-3xl font-bold mb-8">Your Exercises</h1>

                        {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 mb-6">{error}</div>}

                        {assignments.length > 0 ? (
                            <div className="grid gap-4">
                                {assignments.map((assignment, index) => (
                                    <div
                                        key={assignment.id}
                                        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 flex items-center justify-between group hover:border-cyan-500/30 transition-all"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 font-bold text-lg group-hover:bg-cyan-500 group-hover:text-white transition-all">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg mb-1">{assignment.exercise?.name}</h3>
                                                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"></path></svg>
                                                        {assignment.sets} sets
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                        {assignment.reps_per_set} reps
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${assignment.exercise?.difficulty === 'easy' ? 'bg-green-500/10 text-green-500' :
                                                        assignment.exercise?.difficulty === 'hard' ? 'bg-red-500/10 text-red-500' :
                                                            'bg-yellow-500/10 text-yellow-500'
                                                        }`}>
                                                        {assignment.exercise?.difficulty}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => startSession(index)}
                                            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                                        >
                                            Start
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-white/10">
                                <p className="text-slate-500 dark:text-slate-400 text-lg">No exercises assigned yet.</p>
                            </div>
                        )}
                    </main>
                </div>
            )}
        </div>
    )
}
