'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut, User } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

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

    const handleBack = () => {
        stopSession()
        router.push('/patient')
    }

    const handleLogout = async () => {
        stopSession()
        await signOut()
        router.push('/login')
    }

    const currentExercise = assignments[currentIndex]?.exercise

    const startSession = async () => {
        setSessionLoading(true)
        setError('')

        try {
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: false
            })

            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
            }

            // Initialize pose detection
            const { PoseEngine } = await import('@/pose-detection/poseEngine')
            const { PoseRenderer } = await import('@/pose-detection/poseRenderer.js')
            const { PoseAnalyzer } = await import('@/pose-detection/poseAnalyzer.js')
            const { defaultExercise } = await import('@/pose-detection/exerciseConfig.js')

            poseEngineRef.current = new PoseEngine(videoRef.current)
            await poseEngineRef.current.init()

            // Initialize reference video pose engine if video available
            if (referenceVideoRef.current && currentExercise?.video_url) {
                referenceVideoRef.current.src = currentExercise.video_url
                referenceVideoRef.current.load()
                await new Promise<void>((resolve) => {
                    referenceVideoRef.current!.onloadeddata = () => resolve()
                    referenceVideoRef.current!.onerror = () => resolve()
                })

                if (referenceVideoRef.current.readyState >= 2) {
                    referencePoseEngineRef.current = new PoseEngine(referenceVideoRef.current)
                    await referencePoseEngineRef.current.init()
                    referenceVideoRef.current.play()
                }
            }

            // Start pose detection loop
            const poseRenderer = new PoseRenderer(canvasRef.current)
            const poseAnalyzer = new PoseAnalyzer(defaultExercise)

            let poseHoldFrames = 0
            let repCounted = false
            let currentReferencePose: any = null

            const detect = async () => {
                if (!poseEngineRef.current || !videoRef.current) return

                try {
                    const userPoses = await poseEngineRef.current.estimate()

                    // Get reference pose if available
                    if (referencePoseEngineRef.current && referenceVideoRef.current?.readyState >= 2) {
                        const refPoses = await referencePoseEngineRef.current.estimate()
                        if (refPoses?.length) {
                            currentReferencePose = refPoses[0]
                        }
                    }

                    if (userPoses?.length) {
                        const userPose = userPoses[0]

                        // Scale keypoints
                        const container = containerRef.current?.getBoundingClientRect() || { width: 0, height: 0 }
                        const video = {
                            width: videoRef.current.videoWidth || 640,
                            height: videoRef.current.videoHeight || 480
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

                        // Compare poses
                        let isCorrect = false
                        if (currentReferencePose) {
                            const comparison = poseAnalyzer.comparePosesWithFeedback(
                                userPose.keypoints,
                                currentReferencePose.keypoints
                            )
                            isCorrect = comparison.isCorrect
                        } else {
                            const analysis = poseAnalyzer.evaluate(userPose.keypoints)
                            isCorrect = analysis.allSegmentsHit && analysis.accuracy >= 0.60
                        }

                        // Render skeleton
                        poseRenderer.renderSimple(scaledKeypoints, isCorrect)

                        // Rep counting
                        if (isCorrect) {
                            poseHoldFrames++
                            if (poseHoldFrames >= 8 && !repCounted) {
                                repCounted = true
                            }
                        } else {
                            if (repCounted && poseHoldFrames > 0) {
                                setRepCount(prev => prev + 1)
                                repCounted = false
                            }
                            poseHoldFrames = 0
                        }
                    }
                } catch (err) {
                    console.error('Pose detection error:', err)
                }

                animationRef.current = requestAnimationFrame(detect)
            }

            setSessionStarted(true)
            setSessionLoading(false)
            detect()

        } catch (err: any) {
            console.error('Failed to start session:', err)
            setError(err.message || 'Failed to access camera')
            setSessionLoading(false)
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
            await poseEngineRef.current.dispose()
            poseEngineRef.current = null
        }
        if (referencePoseEngineRef.current) {
            await referencePoseEngineRef.current.dispose()
            referencePoseEngineRef.current = null
        }
        setSessionStarted(false)
        setRepCount(0)
    }

    const nextExercise = () => {
        if (currentIndex < assignments.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setRepCount(0)
            // Reload reference video for new exercise
            if (referenceVideoRef.current && assignments[currentIndex + 1]?.exercise?.video_url) {
                referenceVideoRef.current.src = assignments[currentIndex + 1].exercise!.video_url
                referenceVideoRef.current.load()
                referenceVideoRef.current.play()
            }
        }
    }

    const prevExercise = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
            setRepCount(0)
            // Reload reference video for new exercise
            if (referenceVideoRef.current && assignments[currentIndex - 1]?.exercise?.video_url) {
                referenceVideoRef.current.src = assignments[currentIndex - 1].exercise!.video_url
                referenceVideoRef.current.load()
                referenceVideoRef.current.play()
            }
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                <span className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></span>
            </div>
        )
    }

    if (assignments.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-4">No Exercises Assigned</h1>
                    <p className="text-slate-400 mb-6">Your doctor hasn't assigned any exercises yet.</p>
                    <button
                        onClick={handleBack}
                        className="px-6 py-3 bg-slate-800 border border-white/10 rounded-xl hover:bg-slate-700 transition-all"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white" ref={containerRef}>
            {/* Session View */}
            {sessionStarted ? (
                <div className="fixed inset-0 bg-slate-900">
                    {/* Camera Feed - Fullscreen */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                    />
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full"
                        style={{ transform: 'scaleX(-1)' }}
                    />

                    {/* Reference Video - Picture in Picture */}
                    <div className="absolute top-4 right-4 w-64 bg-slate-800/90 backdrop-blur rounded-xl overflow-hidden border border-white/10">
                        <video
                            ref={referenceVideoRef}
                            loop
                            muted
                            playsInline
                            className="w-full aspect-video object-cover"
                        />
                        <div className="p-3">
                            <p className="text-xs text-slate-400 mb-1">Exercise Demo</p>
                            <p className="text-sm font-semibold">{currentExercise?.name}</p>
                        </div>
                    </div>

                    {/* Rep Counter */}
                    <div className="absolute top-4 left-4 bg-emerald-500/20 backdrop-blur border border-emerald-500/30 rounded-xl p-4 text-center">
                        <p className="text-xs font-bold text-emerald-400 tracking-wider">REPS</p>
                        <p className="text-4xl font-bold">{repCount}</p>
                        <p className="text-xs text-slate-400">Target: {assignments[currentIndex]?.reps_per_set || 10}</p>
                    </div>

                    {/* Exercise Progress */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur rounded-full px-4 py-2 flex items-center gap-2">
                        <span className="text-cyan-400 font-semibold">{currentIndex + 1}</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-slate-400">{assignments.length}</span>
                    </div>

                    {/* Status Indicator */}
                    <div className="absolute bottom-24 left-4 bg-slate-800/90 backdrop-blur rounded-full px-4 py-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        <span className="text-sm text-slate-300">Camera Active</span>
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
                        <button
                            onClick={prevExercise}
                            disabled={currentIndex === 0}
                            className="px-4 py-3 bg-slate-800/80 backdrop-blur border border-white/10 rounded-xl hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            ← Previous
                        </button>
                        <button
                            onClick={stopSession}
                            className="px-6 py-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 font-semibold hover:bg-red-500/30 transition-all"
                        >
                            ⬛ Stop Session
                        </button>
                        <button
                            onClick={nextExercise}
                            disabled={currentIndex === assignments.length - 1}
                            className="px-4 py-3 bg-slate-800/80 backdrop-blur border border-white/10 rounded-xl hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-white/10 rounded-full text-slate-300 hover:bg-slate-700 transition-all"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                            Back
                        </button>

                        <div className="flex items-center gap-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                            </svg>
                            <span className="font-bold text-lg bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                                Exercise Session
                            </span>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 border border-white/20 rounded-full text-slate-300 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400 transition-all"
                        >
                            Logout
                        </button>
                    </div>

                    {/* Pre-session Screen */}
                    <div className="pt-24 px-6 pb-6 min-h-screen flex flex-col items-center justify-center">
                        <div className="text-center max-w-lg">
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-3xl mb-8">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                </svg>
                            </div>

                            <h1 className="text-4xl font-bold mb-4">Ready to Exercise?</h1>
                            <p className="text-slate-400 text-lg mb-2">
                                You have {assignments.length} exercise{assignments.length > 1 ? 's' : ''} to complete
                            </p>
                            <p className="text-cyan-400 mb-8">
                                Starting with: {currentExercise?.name}
                            </p>

                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={startSession}
                                disabled={sessionLoading}
                                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-xl text-slate-900 text-lg font-bold flex items-center justify-center gap-3 mx-auto hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-1 transition-all disabled:opacity-60"
                            >
                                {sessionLoading ? (
                                    <>
                                        <span className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span>
                                        Starting Camera...
                                    </>
                                ) : (
                                    <>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="5,3 19,12 5,21"></polygon>
                                        </svg>
                                        Start Session
                                    </>
                                )}
                            </button>

                            {/* Exercise Queue Preview */}
                            <div className="mt-8 p-6 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl text-left">
                                <h3 className="font-semibold text-cyan-400 mb-3">Exercise Queue:</h3>
                                <div className="space-y-2">
                                    {assignments.map((assignment, idx) => (
                                        <div
                                            key={assignment.id}
                                            className={`flex items-center gap-3 p-2 rounded-lg ${idx === currentIndex ? 'bg-cyan-500/10 border border-cyan-500/30' : ''
                                                }`}
                                        >
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === currentIndex ? 'bg-cyan-500 text-slate-900' : 'bg-slate-700 text-slate-400'
                                                }`}>
                                                {idx + 1}
                                            </span>
                                            <span className={idx === currentIndex ? 'text-white' : 'text-slate-400'}>
                                                {assignment.exercise?.name}
                                            </span>
                                            <span className="text-slate-500 text-sm ml-auto">
                                                {assignment.reps_per_set} reps
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
