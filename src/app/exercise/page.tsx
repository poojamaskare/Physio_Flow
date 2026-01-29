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
    completed?: boolean
    completed_at?: string
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
    const [currentSet, setCurrentSet] = useState(1)
    const [setCompleteMessage, setSetCompleteMessage] = useState('')
    const [exerciseCompleted, setExerciseCompleted] = useState(false)

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

    // Handle set completion - don't stop until all sets are done
    useEffect(() => {
        if (sessionStarted && repCount > 0) {
            const targetReps = assignments[currentIndex]?.reps_per_set || 10
            const totalSets = assignments[currentIndex]?.sets || 3

            if (repCount >= targetReps) {
                if (currentSet < totalSets) {
                    // Set complete, but more sets to go
                    setSetCompleteMessage(`Set ${currentSet} Complete! 🎉`)
                    setTimeout(() => {
                        setCurrentSet(prev => prev + 1)
                        setRepCount(0)
                        setSetCompleteMessage('')
                    }, 2000)
                } else {
                    // All sets complete!
                    setExerciseCompleted(true)
                    setSetCompleteMessage(`All ${totalSets} Sets Complete! 🏆`)
                    // Mark exercise as completed in database
                    markExerciseComplete()
                    setTimeout(() => {
                        stopSession()
                    }, 3000)
                }
            }
        }
    }, [repCount, sessionStarted, currentIndex, assignments, currentSet])

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

    // Mark exercise as completed in database
    const markExerciseComplete = async () => {
        const assignment = assignments[currentIndex]
        if (!assignment) return

        await supabase
            .from('patient_exercises')
            .update({
                completed: true,
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', assignment.id)

        // Refresh assignments to show updated status
        fetchAssignments()
    }

    const currentExercise = assignments[currentIndex]?.exercise

    const startSession = async (index?: number) => {
        if (typeof index === 'number') {
            setCurrentIndex(index)
        }

        // Reset states for new session
        setRepCount(0)
        setCurrentSet(1)
        setSetCompleteMessage('')
        setExerciseCompleted(false)

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
                            <p className="text-cyan-400 font-bold tracking-widest animate-pulse">Get ready for your exercise...</p>
                        </div>
                    )}

                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-32 sm:w-48 md:w-64 lg:w-80 bg-slate-800/90 rounded-lg sm:rounded-xl overflow-hidden border border-white/10">
                        <video
                            ref={referenceVideoRef}
                            loop
                            muted
                            playsInline
                            crossOrigin="anonymous"
                            className="w-full aspect-video object-contain bg-black"
                        />
                        <div className="p-1 sm:p-2 text-center">
                            <p className="text-xs sm:text-sm text-slate-300 font-semibold">Demo</p>
                        </div>
                    </div>

                    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center shadow-2xl dark:shadow-emerald-500/20 z-10 transition-all">
                        <p className="text-[10px] sm:text-xs font-black text-cyan-400 tracking-widest sm:tracking-[0.2em] mb-0.5 sm:mb-1">SET {currentSet} / {assignments[currentIndex]?.sets || 3}</p>
                        <p className="text-[10px] sm:text-xs font-black text-emerald-400 tracking-widest sm:tracking-[0.2em] mb-0.5 sm:mb-1">REPS</p>
                        <p className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white">{repCount}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">Goal: {currentTarget}</p>
                        {repCount >= currentTarget && (
                            <div className="mt-2 sm:mt-4 py-1 sm:py-2 px-2 sm:px-3 bg-emerald-500 text-slate-900 rounded-lg font-black text-[10px] sm:text-xs animate-bounce">
                                🎉 GOAL!
                            </div>
                        )}
                    </div>

                    {/* Set Complete Message Overlay */}
                    {setCompleteMessage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-40">
                            <div className={`text-center px-8 py-6 rounded-2xl border ${exerciseCompleted ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-slate-800/90 border-cyan-500/30'}`}>
                                <p className={`text-2xl font-semibold mb-2 ${exerciseCompleted ? 'text-emerald-400' : 'text-white'}`}>{setCompleteMessage}</p>
                                {!exerciseCompleted && (
                                    <p className="text-sm text-slate-400">Preparing Set {currentSet + 1}...</p>
                                )}
                                {exerciseCompleted && (
                                    <p className="text-sm text-emerald-300/80">Exercise complete!</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="absolute bottom-4 sm:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 w-[95%] sm:w-auto justify-center">
                        <button onClick={prevExercise} disabled={currentIndex === 0} className="px-3 sm:px-6 py-2 sm:py-3 bg-slate-800/80 text-white rounded-lg sm:rounded-xl disabled:opacity-30 hover:bg-slate-700 text-sm sm:text-base">Prev</button>
                        <button onClick={stopSession} className="px-4 sm:px-8 py-2 sm:py-3 bg-red-500/80 text-white rounded-lg sm:rounded-xl font-bold hover:bg-red-600 text-sm sm:text-base">STOP</button>
                        <button
                            onClick={nextExercise}
                            disabled={currentIndex === assignments.length - 1 && repCount < currentTarget}
                            className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all text-sm sm:text-base ${repCount >= currentTarget
                                ? 'bg-emerald-500 text-slate-900 font-bold sm:scale-110 shadow-lg shadow-emerald-500/30'
                                : 'bg-slate-800/80 text-white disabled:opacity-30'
                                }`}
                        >
                            {currentIndex === assignments.length - 1 ? 'Finish' : 'Next →'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex bg-slate-50 dark:bg-slate-900 min-h-screen">
                    <div className="hidden md:block">
                        <Sidebar user={user} onLogout={handleLogout} />
                    </div>
                    <main className="md:ml-64 p-4 sm:p-8 w-full">
                        {/* Mobile header */}
                        <div className="md:hidden flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold">Exercises</h1>
                            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">
                                Logout
                            </button>
                        </div>
                        <h1 className="hidden md:block text-3xl font-bold mb-8">Your Exercises</h1>

                        {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 mb-6">{error}</div>}

                        {assignments.length > 0 ? (
                            <div className="grid gap-3 sm:gap-4">
                                {assignments.map((assignment, index) => (
                                    <div
                                        key={assignment.id}
                                        className={`bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-4 group transition-all ${assignment.completed
                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                            : 'border-slate-200 dark:border-white/5 hover:border-cyan-500/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4 sm:gap-6">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${assignment.completed
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-white'
                                                }`}>
                                                {assignment.completed ? (
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                ) : (
                                                    index + 1
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg mb-1">
                                                    {assignment.exercise?.name}
                                                    {assignment.completed && (
                                                        <span className="ml-2 text-sm text-emerald-500 font-normal">✓ Completed</span>
                                                    )}
                                                </h3>
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
                                            className={`px-6 py-2 rounded-lg font-semibold transition-opacity ${assignment.completed
                                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                                                }`}
                                        >
                                            {assignment.completed ? 'Redo' : 'Start'}
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
