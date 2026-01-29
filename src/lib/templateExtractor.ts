/**
 * Template Extractor - Extracts pose templates from exercise videos
 * 
 * This utility processes exercise videos to extract:
 * - Keyframe poses at regular intervals
 * - Joint angles for each keyframe
 * - Movement phases (start, peak positions)
 */

import { supabase } from './supabase'

// MediaPipe landmark indices
const LANDMARK_NAMES = [
    'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer',
    'right_eye_inner', 'right_eye', 'right_eye_outer',
    'left_ear', 'right_ear', 'mouth_left', 'mouth_right',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky',
    'left_index', 'right_index', 'left_thumb', 'right_thumb',
    'left_hip', 'right_hip', 'left_knee', 'right_knee',
    'left_ankle', 'right_ankle', 'left_heel', 'right_heel',
    'left_foot_index', 'right_foot_index'
]

// Key angles to calculate (joint_name: [point_a, vertex, point_b])
const KEY_ANGLES: Record<string, [string, string, string]> = {
    left_elbow: ['left_shoulder', 'left_elbow', 'left_wrist'],
    right_elbow: ['right_shoulder', 'right_elbow', 'right_wrist'],
    left_shoulder: ['left_elbow', 'left_shoulder', 'left_hip'],
    right_shoulder: ['right_elbow', 'right_shoulder', 'right_hip'],
    left_hip: ['left_shoulder', 'left_hip', 'left_knee'],
    right_hip: ['right_shoulder', 'right_hip', 'right_knee'],
    left_knee: ['left_hip', 'left_knee', 'left_ankle'],
    right_knee: ['right_hip', 'right_knee', 'right_ankle'],
}

interface Landmark {
    x: number
    y: number
    z?: number
    visibility?: number
}

interface KeyframeData {
    timestamp: number
    landmarks: Record<string, Landmark>
    angles: Record<string, number>
}

interface PhaseDefinition {
    name: string
    angles: Record<string, number>
    timestamp: number
}

interface ExerciseTemplate {
    phases: PhaseDefinition[]
    repSequence: string[]
    toleranceDegrees: number
}

/**
 * Calculate angle between three points (in degrees)
 * Point B is the vertex of the angle
 */
export function calculateAngle(
    pointA: Landmark,
    pointB: Landmark,
    pointC: Landmark
): number {
    const radians = Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
        Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x)

    let angle = Math.abs(radians * 180 / Math.PI)

    if (angle > 180) {
        angle = 360 - angle
    }

    return Math.round(angle)
}

/**
 * Extract all key angles from a set of landmarks
 */
export function extractAngles(landmarks: Record<string, Landmark>): Record<string, number> {
    const angles: Record<string, number> = {}

    for (const [angleName, [pointAName, vertexName, pointBName]] of Object.entries(KEY_ANGLES)) {
        const pointA = landmarks[pointAName]
        const vertex = landmarks[vertexName]
        const pointB = landmarks[pointBName]

        if (pointA && vertex && pointB) {
            // Check visibility
            const minVisibility = 0.5
            if ((pointA.visibility ?? 1) >= minVisibility &&
                (vertex.visibility ?? 1) >= minVisibility &&
                (pointB.visibility ?? 1) >= minVisibility) {
                angles[angleName] = calculateAngle(pointA, vertex, pointB)
            }
        }
    }

    return angles
}

/**
 * Identify distinct phases from keyframes based on angle extremes
 */
export function identifyPhases(keyframes: KeyframeData[]): PhaseDefinition[] {
    if (keyframes.length === 0) return []

    const phases: PhaseDefinition[] = []

    // Find the most varying angle (the one that changes most)
    const angleNames = Object.keys(keyframes[0]?.angles || {})
    let maxVariance = 0
    let primaryAngle = angleNames[0] || 'left_elbow'

    for (const angleName of angleNames) {
        const values = keyframes.map(kf => kf.angles[angleName]).filter(v => v !== undefined)
        if (values.length > 0) {
            const min = Math.min(...values)
            const max = Math.max(...values)
            const variance = max - min
            if (variance > maxVariance) {
                maxVariance = variance
                primaryAngle = angleName
            }
        }
    }

    // Find min and max positions for the primary angle
    let minFrame = keyframes[0]
    let maxFrame = keyframes[0]
    let minAngle = keyframes[0]?.angles[primaryAngle] ?? 180
    let maxAngle = keyframes[0]?.angles[primaryAngle] ?? 0

    for (const kf of keyframes) {
        const angle = kf.angles[primaryAngle]
        if (angle !== undefined) {
            if (angle < minAngle) {
                minAngle = angle
                minFrame = kf
            }
            if (angle > maxAngle) {
                maxAngle = angle
                maxFrame = kf
            }
        }
    }

    // Determine which is "start" and which is "peak"
    // Usually start position has more extended limbs (higher angles)
    if (minFrame.timestamp < maxFrame.timestamp) {
        phases.push({
            name: 'start',
            angles: minFrame.angles,
            timestamp: minFrame.timestamp
        })
        phases.push({
            name: 'peak',
            angles: maxFrame.angles,
            timestamp: maxFrame.timestamp
        })
    } else {
        phases.push({
            name: 'start',
            angles: maxFrame.angles,
            timestamp: maxFrame.timestamp
        })
        phases.push({
            name: 'peak',
            angles: minFrame.angles,
            timestamp: minFrame.timestamp
        })
    }

    return phases
}

/**
 * Process a video element and extract pose template
 * This runs in the browser using the video element
 */
export async function extractTemplateFromVideo(
    videoElement: HTMLVideoElement,
    sampleIntervalMs: number = 500
): Promise<ExerciseTemplate | null> {
    // Dynamically import pose detection
    const poseDetection = await import('@tensorflow-models/pose-detection')
    const tf = await import('@tensorflow/tfjs-core')
    await import('@tensorflow/tfjs-backend-webgl')

    await tf.ready()
    await tf.setBackend('webgl')

    // Create detector
    const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
            enableSmoothing: true
        }
    )

    const keyframes: KeyframeData[] = []
    const duration = videoElement.duration

    // OPTIMIZE: Limit to maximum 10 samples for fast processing
    const maxSamples = 10
    const actualInterval = Math.max(sampleIntervalMs, (duration * 1000) / maxSamples)
    const numSamples = Math.min(maxSamples, Math.floor((duration * 1000) / actualInterval))

    console.log(`Sampling ${numSamples} frames from ${duration.toFixed(1)}s video (every ${(actualInterval / 1000).toFixed(1)}s)`)

    // Sample video at regular intervals
    for (let i = 0; i <= numSamples; i++) {
        const timestamp = (i * actualInterval) / 1000

        // Seek to timestamp
        videoElement.currentTime = timestamp
        await new Promise(resolve => {
            videoElement.onseeked = resolve
        })

        // Wait for frame to render
        await new Promise(resolve => setTimeout(resolve, 100))

        // Get pose
        try {
            const poses = await detector.estimatePoses(videoElement)

            if (poses.length > 0 && poses[0].keypoints) {
                const landmarks: Record<string, Landmark> = {}

                // Convert keypoints to landmarks object
                for (const kp of poses[0].keypoints) {
                    if (kp.name) {
                        landmarks[kp.name] = {
                            x: kp.x / videoElement.videoWidth,
                            y: kp.y / videoElement.videoHeight,
                            visibility: kp.score
                        }
                    }
                }

                const angles = extractAngles(landmarks)

                keyframes.push({
                    timestamp,
                    landmarks,
                    angles
                })
            }
        } catch (err) {
            console.warn(`Failed to extract pose at ${timestamp}s:`, err)
        }
    }

    // Clean up
    await detector.dispose()

    if (keyframes.length < 2) {
        console.error('Not enough keyframes extracted')
        return null
    }

    // Identify phases
    const phases = identifyPhases(keyframes)

    return {
        phases,
        repSequence: ['start', 'peak', 'start'],
        toleranceDegrees: 30
    }
}

/**
 * Save extracted template to database
 */
export async function saveTemplateToDatabase(
    exerciseId: string,
    template: ExerciseTemplate,
    keyframes?: KeyframeData[]
): Promise<boolean> {
    try {
        // UPDATE the existing template entry (created with 'processing' status)
        const { data, error } = await supabase
            .from('exercise_templates')
            .update({
                phases: template.phases,
                tolerance_degrees: template.toleranceDegrees,
                rep_sequence: template.repSequence,
                status: 'ready',
                updated_at: new Date().toISOString()
            })
            .eq('exercise_id', exerciseId)
            .select()

        if (error) {
            console.error('Failed to save template:', error)
            return false
        }

        console.log('Template saved successfully:', data)

        // Optionally save keyframes
        if (keyframes && data?.[0]?.id) {
            const templateId = data[0].id

            const keyframeRows = keyframes.map(kf => ({
                template_id: templateId,
                timestamp_seconds: kf.timestamp,
                phase_name: 'extracted',
                angles: kf.angles,
                landmarks: kf.landmarks
            }))

            await supabase.from('exercise_keyframes').insert(keyframeRows)
        }

        return true
    } catch (err) {
        console.error('Database error:', err)
        return false
    }
}

/**
 * Load template from database for an exercise
 */
export async function loadTemplateFromDatabase(
    exerciseId: string
): Promise<ExerciseTemplate | null> {
    const { data, error } = await supabase
        .from('exercise_templates')
        .select('*')
        .eq('exercise_id', exerciseId)
        .eq('status', 'ready')
        .single()

    if (error || !data) {
        return null
    }

    return {
        phases: data.phases as PhaseDefinition[],
        repSequence: data.rep_sequence as string[] || ['start', 'peak', 'start'],
        toleranceDegrees: data.tolerance_degrees || 30
    }
}

/**
 * Compare user's current angles to template phases
 * Returns the best matching phase and similarity score
 */
export function matchPoseToPhase(
    userAngles: Record<string, number>,
    template: ExerciseTemplate
): { phase: string | null; similarity: number; isMatch: boolean } {
    let bestPhase: string | null = null
    let bestSimilarity = 0

    for (const phase of template.phases) {
        let matchingAngles = 0
        let totalAngles = 0

        for (const [angleName, targetAngle] of Object.entries(phase.angles)) {
            const userAngle = userAngles[angleName]
            if (userAngle !== undefined) {
                totalAngles++
                const diff = Math.abs(userAngle - targetAngle)
                if (diff <= template.toleranceDegrees) {
                    matchingAngles++
                }
            }
        }

        const similarity = totalAngles > 0 ? matchingAngles / totalAngles : 0

        if (similarity > bestSimilarity) {
            bestSimilarity = similarity
            bestPhase = phase.name
        }
    }

    return {
        phase: bestPhase,
        similarity: bestSimilarity,
        isMatch: bestSimilarity >= 0.5 // At least 50% of angles match
    }
}
