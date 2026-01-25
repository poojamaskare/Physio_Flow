'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut, User } from '@/lib/auth'

export default function ExercisePage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [exerciseStarted, setExerciseStarted] = useState(false)
    const [exerciseLoading, setExerciseLoading] = useState(false)
    const [error, setError] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const appRef = useRef<any>(null)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const currentUser = await getCurrentUser()
        if (!currentUser || currentUser.role !== 'patient') {
            router.push('/login')
            return
        }
        setUser(currentUser)
        setLoading(false)
    }

    const handleBack = async () => {
        if (appRef.current && exerciseStarted) {
            try {
                await appRef.current.stopSession?.()
            } catch (e) { }
        }
        router.push('/patient')
    }

    const handleLogout = async () => {
        if (appRef.current && exerciseStarted) {
            try {
                await appRef.current.stopSession?.()
            } catch (e) { }
        }
        await signOut()
        router.push('/login')
    }

    const startExercise = async () => {
        if (!containerRef.current) return

        setExerciseLoading(true)
        setError('')

        try {
            // Dynamically import TensorFlow and pose detection
            const tf = await import('@tensorflow/tfjs-core')
            await import('@tensorflow/tfjs-backend-webgl')
            await tf.ready()

            const poseDetection = await import('@tensorflow-models/pose-detection')

            // Create detector using MoveNet (doesn't require mediapipe)
            const detector = await poseDetection.createDetector(
                poseDetection.SupportedModels.MoveNet,
                {
                    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
                    enableSmoothing: true
                }
            )

            // Start video
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: false
            })

            setExerciseStarted(true)
            setExerciseLoading(false)

            // Render exercise UI
            if (containerRef.current) {
                containerRef.current.innerHTML = `
                    <div style="position: fixed; inset: 0; background: #0a1628;">
                        <video id="exerciseVideo" autoplay playsinline muted style="position: absolute; width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1);"></video>
                        <canvas id="exerciseCanvas" style="position: absolute; width: 100%; height: 100%; transform: scaleX(-1);"></canvas>
                        <div id="repCounter" style="position: absolute; top: 24px; right: 24px; background: rgba(94,243,140,0.2); backdrop-filter: blur(20px); border: 2px solid rgba(94,243,140,0.3); border-radius: 20px; padding: 16px 24px; text-align: center;">
                            <div style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.2em; color: #5EF38C;">REPS</div>
                            <div id="repValue" style="font-size: 2.8rem; font-weight: 700; color: white;">0</div>
                        </div>
                        <div id="feedback" style="position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%); background: rgba(15,30,50,0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 50px; padding: 14px 24px; color: white; font-size: 1rem;">
                            Position yourself in the frame
                        </div>
                        <div style="position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%); display: flex; gap: 12px;">
                            <button id="stopBtn" style="display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: rgba(242,95,92,0.2); border: 1px solid rgba(242,95,92,0.4); border-radius: 30px; color: #F25F5C; font-size: 0.9rem; font-weight: 600; cursor: pointer;">
                                ⬛ Stop Exercise
                            </button>
                        </div>
                        <div id="statusDot" style="position: absolute; top: 24px; left: 24px; display: flex; align-items: center; gap: 10px; background: rgba(15,30,50,0.95); padding: 10px 16px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1);">
                            <span style="width: 10px; height: 10px; background: #5EF38C; border-radius: 50%; box-shadow: 0 0 12px #5EF38C;"></span>
                            <span style="color: rgba(255,255,255,0.7); font-size: 0.85rem;">Active</span>
                        </div>
                    </div>
                `

                const video = document.getElementById('exerciseVideo') as HTMLVideoElement
                const canvas = document.getElementById('exerciseCanvas') as HTMLCanvasElement
                const ctx = canvas.getContext('2d')!
                const repValue = document.getElementById('repValue')!
                const feedback = document.getElementById('feedback')!
                const stopBtn = document.getElementById('stopBtn')!

                video.srcObject = stream
                await video.play()

                // Set canvas size
                canvas.width = window.innerWidth
                canvas.height = window.innerHeight

                let running = true
                let repCount = 0
                let poseHoldFrames = 0
                let repCounted = false

                // Stop button handler
                stopBtn.onclick = () => {
                    running = false
                    stream.getTracks().forEach(t => t.stop())
                    detector.dispose()
                    setExerciseStarted(false)
                    if (containerRef.current) containerRef.current.innerHTML = ''
                }

                // Detection loop
                const detectPose = async () => {
                    if (!running) return

                    try {
                        const poses = await detector.estimatePoses(video)

                        // Clear canvas
                        ctx.clearRect(0, 0, canvas.width, canvas.height)

                        if (poses.length > 0) {
                            const pose = poses[0]
                            const keypoints = pose.keypoints

                            // Calculate pose quality (simple heuristic)
                            const visibleKeypoints = keypoints.filter(kp => (kp.score || 0) > 0.3)
                            const avgConfidence = visibleKeypoints.reduce((sum, kp) => sum + (kp.score || 0), 0) / visibleKeypoints.length
                            const isGoodPose = avgConfidence > 0.5 && visibleKeypoints.length >= 10

                            // Draw skeleton
                            const color = isGoodPose ? '#5EF38C' : '#F25F5C'
                            ctx.strokeStyle = color
                            ctx.lineWidth = 4
                            ctx.shadowColor = color
                            ctx.shadowBlur = 15

                            // Scale keypoints
                            const scaleX = canvas.width / video.videoWidth
                            const scaleY = canvas.height / video.videoHeight

                            // Draw connections
                            const connections = [
                                [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
                                [5, 11], [6, 12], [11, 12],
                                [11, 13], [13, 15], [12, 14], [14, 16]
                            ]

                            connections.forEach(([i, j]) => {
                                const kp1 = keypoints[i]
                                const kp2 = keypoints[j]
                                if ((kp1.score || 0) > 0.3 && (kp2.score || 0) > 0.3) {
                                    ctx.beginPath()
                                    ctx.moveTo(kp1.x * scaleX, kp1.y * scaleY)
                                    ctx.lineTo(kp2.x * scaleX, kp2.y * scaleY)
                                    ctx.stroke()
                                }
                            })

                            // Draw keypoints
                            ctx.fillStyle = color
                            keypoints.forEach(kp => {
                                if ((kp.score || 0) > 0.3) {
                                    ctx.beginPath()
                                    ctx.arc(kp.x * scaleX, kp.y * scaleY, 6, 0, Math.PI * 2)
                                    ctx.fill()
                                }
                            })

                            // Rep counting
                            if (isGoodPose) {
                                poseHoldFrames++
                                if (poseHoldFrames >= 15 && !repCounted) {
                                    repCounted = true
                                    feedback.textContent = 'Perfect! Hold this pose! 💪'
                                    feedback.style.background = 'rgba(94,243,140,0.15)'
                                    feedback.style.borderColor = 'rgba(94,243,140,0.4)'
                                }
                            } else {
                                if (repCounted && poseHoldFrames < 5) {
                                    repCount++
                                    repValue.textContent = String(repCount)
                                    feedback.textContent = `Rep ${repCount} completed! 🎉`
                                }
                                poseHoldFrames = 0
                                repCounted = false

                                if (!repCounted) {
                                    feedback.textContent = 'Adjust your pose - try to match the correct position'
                                    feedback.style.background = 'rgba(255,179,71,0.15)'
                                    feedback.style.borderColor = 'rgba(255,179,71,0.4)'
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Pose detection error:', e)
                    }

                    if (running) {
                        requestAnimationFrame(detectPose)
                    }
                }

                detectPose()
            }
        } catch (err: any) {
            console.error('Failed to start exercise:', err)
            setError(err.message || 'Failed to start exercise. Please allow camera access.')
            setExerciseLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                <div className="flex items-center gap-3">
                    <span className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></span>
                    Loading...
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            {/* Top Bar */}
            {!exerciseStarted && (
                <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-white/10 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
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
                            PhysioFlow Exercise
                        </span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 border border-white/20 rounded-full text-slate-300 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400 transition-all"
                    >
                        Logout
                    </button>
                </div>
            )}

            {/* Exercise Container */}
            <div
                ref={containerRef}
                className={exerciseStarted ? "fixed inset-0 w-full h-full z-40" : "hidden"}
            />

            {/* Start Screen */}
            {!exerciseStarted && (
                <div className="pt-24 px-6 pb-6 min-h-screen flex flex-col items-center justify-center">
                    <div className="text-center max-w-lg">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-3xl mb-8">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                            </svg>
                        </div>

                        <h1 className="text-4xl font-bold mb-4">Exercise Session</h1>
                        <p className="text-slate-400 text-lg mb-8">
                            Welcome, {user?.name}! Click the button below to start your AI-powered physiotherapy session.
                        </p>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={startExercise}
                            disabled={exerciseLoading}
                            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-xl text-slate-900 text-lg font-bold flex items-center justify-center gap-3 mx-auto hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {exerciseLoading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span>
                                    Loading AI Model...
                                </>
                            ) : (
                                <>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="5,3 19,12 5,21"></polygon>
                                    </svg>
                                    Start Exercise
                                </>
                            )}
                        </button>

                        <div className="mt-8 p-6 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl text-left">
                            <h3 className="font-semibold text-cyan-400 mb-3">What to expect:</h3>
                            <ul className="text-slate-300 text-sm space-y-2">
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full"></span>
                                    Camera access for real-time pose detection
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full"></span>
                                    Green skeleton = good pose, Red = adjust position
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full"></span>
                                    Automatic repetition counting
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full"></span>
                                    Real-time feedback messages
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
