import { calculateAngle, clamp } from './utils/math.js'

const MIN_CONFIDENCE = 0.25  // Lowered for easier detection

export class PoseAnalyzer {
  constructor(exerciseConfig) {
    this.exercise = exerciseConfig
    this.previousAngles = new Map()
  }

  // New method: Compare user pose with reference pose and return feedback
  comparePosesWithFeedback(userKeypoints, referenceKeypoints, threshold = 0.50) {  // Lowered from 0.65 to 0.50
    if (!Array.isArray(userKeypoints) || !Array.isArray(referenceKeypoints)) {
      return { isCorrect: false, feedback: 'Position yourself in frame' }
    }

    const userMap = this.#toMap(userKeypoints)
    const refMap = this.#toMap(referenceKeypoints)

    // Joint comparisons with friendly names
    const jointComparisons = [
      { points: ['left_shoulder', 'left_elbow', 'left_wrist'], name: 'left arm' },
      { points: ['right_shoulder', 'right_elbow', 'right_wrist'], name: 'right arm' },
      { points: ['left_hip', 'left_knee', 'left_ankle'], name: 'left leg' },
      { points: ['right_hip', 'right_knee', 'right_ankle'], name: 'right leg' },
      { points: ['left_shoulder', 'left_hip', 'left_knee'], name: 'left side posture' },
      { points: ['right_shoulder', 'right_hip', 'right_knee'], name: 'right side posture' }
    ]

    let matchingJoints = 0
    let totalJoints = 0
    const issues = []

    for (const joint of jointComparisons) {
      const [p1, p2, p3] = joint.points

      const userP1 = userMap.get(p1)
      const userP2 = userMap.get(p2)
      const userP3 = userMap.get(p3)

      const refP1 = refMap.get(p1)
      const refP2 = refMap.get(p2)
      const refP3 = refMap.get(p3)

      // Check visibility
      const userVisible = [userP1, userP2, userP3].every(p => p && p.score >= MIN_CONFIDENCE)
      const refVisible = [refP1, refP2, refP3].every(p => p && p.score >= MIN_CONFIDENCE)

      if (userVisible && refVisible) {
        const userAngle = calculateAngle(userP1, userP2, userP3)
        const refAngle = calculateAngle(refP1, refP2, refP3)

        if (userAngle !== null && refAngle !== null) {
          totalJoints++
          const angleDiff = userAngle - refAngle
          const absDiff = Math.abs(angleDiff)

          // Allow 45 degrees tolerance for much easier matching
          if (absDiff <= 45) {
            matchingJoints++
          } else {
            // Generate helpful feedback
            const action = this.#getSuggestion(joint.name, angleDiff)
            issues.push(action)
          }
        }
      }
    }

    // Need at least 2 comparable joints
    if (totalJoints < 2) {
      return {
        isCorrect: false,
        feedback: 'Move back to show your full body in frame'
      }
    }

    const similarity = matchingJoints / totalJoints
    const isCorrect = similarity >= threshold

    // Build feedback message
    let feedback = ''
    if (isCorrect) {
      feedback = 'Great form! Hold this position!'
    } else if (issues.length > 0) {
      // Show the most important correction
      feedback = issues[0]
    } else {
      feedback = 'Keep adjusting to match the exercise video'
    }

    return { isCorrect, feedback, similarity }
  }

  // Generate helpful suggestions based on angle difference
  #getSuggestion(jointName, angleDiff) {
    const direction = angleDiff > 0 ? 'lower' : 'raise'
    const altDirection = angleDiff > 0 ? 'bend' : 'straighten'

    const suggestions = {
      'left arm': angleDiff > 0
        ? 'Bend your left arm more'
        : 'Straighten your left arm',
      'right arm': angleDiff > 0
        ? 'Bend your right arm more'
        : 'Straighten your right arm',
      'left leg': angleDiff > 0
        ? 'Bend your left knee more'
        : 'Straighten your left leg',
      'right leg': angleDiff > 0
        ? 'Bend your right knee more'
        : 'Straighten your right leg',
      'left side posture': angleDiff > 0
        ? 'Lean your torso back slightly'
        : 'Lean forward slightly',
      'right side posture': angleDiff > 0
        ? 'Straighten your back'
        : 'Bend at the hips more'
    }

    return suggestions[jointName] || `Adjust your ${jointName}`
  }

  // Legacy method for backwards compatibility
  comparePoses(userKeypoints, referenceKeypoints, threshold = 0.65) {
    const result = this.comparePosesWithFeedback(userKeypoints, referenceKeypoints, threshold)
    return result.isCorrect
  }

  // Original evaluate method for fallback when no reference video
  evaluate(keypoints) {
    if (!Array.isArray(keypoints) || !keypoints.length) {
      return {
        segments: [],
        accuracy: 0,
        allSegmentsHit: false,
        message: 'Step into the frame to begin'
      }
    }

    const keypointMap = this.#toMap(keypoints)
    const results = this.exercise.segments.map((segment) => {
      const evaluation = this.#evaluateSegment(segment, keypointMap)
      this.previousAngles.set(segment.id, evaluation.angle ?? this.previousAngles.get(segment.id) ?? null)
      return evaluation
    })

    const weightedScores = results.map((segment) => segment.scoreContribution * (segment.weight ?? 1))
    const totalWeight = this.exercise.segments.reduce((sum, segment) => sum + (segment.weight ?? 1), 0)
    const accuracy = totalWeight ? weightedScores.reduce((sum, value) => sum + value, 0) / totalWeight : 0

    const visibleSegments = results.filter((segment) => segment.visible)
    const missedSegments = results.filter((segment) => segment.visible && !segment.hit)

    // Generate feedback message
    let message = 'Good posture - keep holding!'
    if (missedSegments.length > 0) {
      const firstMiss = missedSegments[0]
      if (firstMiss.diff > 0) {
        message = firstMiss.cues?.high || `Adjust your ${firstMiss.label.toLowerCase()}`
      } else {
        message = firstMiss.cues?.low || `Adjust your ${firstMiss.label.toLowerCase()}`
      }
    } else if (visibleSegments.length === 0) {
      message = 'Move back to show your full body'
    }

    return {
      segments: results,
      accuracy: clamp(accuracy, 0, 1),
      coverage: visibleSegments.length / this.exercise.segments.length,
      allSegmentsHit: visibleSegments.length > 0 && missedSegments.length === 0,
      message
    }
  }

  #evaluateSegment(segment, keypointMap) {
    const { id, points, targetAngle, tolerance, label, cues = {}, weight = 1 } = segment
    const [start, middle, end] = points.map((name) => keypointMap.get(name))
    const visible = [start, middle, end].every((point) => point && point.score >= MIN_CONFIDENCE)

    let angle = null
    if (visible) {
      angle = calculateAngle(start, middle, end)
    }

    const diff = angle === null ? null : angle - targetAngle
    const hit = visible && diff !== null && Math.abs(diff) <= tolerance
    let scoreContribution = 0

    if (visible && diff !== null) {
      if (hit) {
        scoreContribution = 1
      } else {
        scoreContribution = clamp(1 - Math.abs(diff) / (tolerance * 2), 0, 0.9)
      }
    }

    return {
      id,
      label,
      points,
      visible,
      angle,
      diff,
      hit,
      tolerance,
      weight,
      scoreContribution,
      cues
    }
  }

  #toMap(keypoints) {
    const map = new Map()
    keypoints.forEach((keypoint) => {
      if (!keypoint) {
        return
      }
      const name = keypoint.name ?? keypoint.part
      map.set(name, {
        x: keypoint.x ?? keypoint.position?.x ?? 0,
        y: keypoint.y ?? keypoint.position?.y ?? 0,
        score: keypoint.score ?? keypoint.confidence ?? 0
      })
    })
    return map
  }
}
