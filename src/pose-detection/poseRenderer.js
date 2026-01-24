const BASE_CONNECTIONS = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle']
]

const COLORS = {
  correct: '#5EF38C',    // Green - pose matches
  incorrect: '#F25F5C',  // Red - pose doesn't match
  point: '#FFFFFF'       // White keypoints
}

export class PoseRenderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.pixelRatio = window.devicePixelRatio || 1
    this.displayWidth = 0
    this.displayHeight = 0
    this.flashAlpha = 0
    this.currentColor = COLORS.incorrect
    this.targetColor = COLORS.incorrect
  }

  resize(width, height) {
    if (!width || !height) {
      return
    }

    this.displayWidth = width
    this.displayHeight = height
    this.canvas.width = width * this.pixelRatio
    this.canvas.height = height * this.pixelRatio
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
  }

  // New simplified render method - just green or red
  renderSimple(keypoints = [], isCorrect = false) {
    if (!this.ctx) {
      return
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    const color = isCorrect ? COLORS.correct : COLORS.incorrect
    const map = this.#toMap(keypoints)

    this.#drawSkeleton(map, color)
    this.#drawKeypoints(map, color)
    this.#drawFlash()
  }

  // Legacy render method for backwards compatibility
  render(keypoints = [], analysis) {
    const isCorrect = analysis?.allSegmentsHit && analysis?.accuracy >= 0.75
    this.renderSimple(keypoints, isCorrect)
  }

  triggerCelebration() {
    this.flashAlpha = 0.85
  }

  #drawSkeleton(map, color) {
    this.ctx.lineWidth = 5 * this.pixelRatio
    this.ctx.strokeStyle = color
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'

    // Add glow effect
    this.ctx.shadowColor = color
    this.ctx.shadowBlur = 10 * this.pixelRatio

    BASE_CONNECTIONS.forEach(([aName, bName]) => {
      const a = map.get(aName)
      const b = map.get(bName)
      if (!a || !b || a.score < 0.3 || b.score < 0.3) {
        return
      }
      this.ctx.beginPath()
      this.ctx.moveTo(a.x * this.pixelRatio, a.y * this.pixelRatio)
      this.ctx.lineTo(b.x * this.pixelRatio, b.y * this.pixelRatio)
      this.ctx.stroke()
    })

    // Reset shadow
    this.ctx.shadowBlur = 0
  }

  #drawKeypoints(map, color) {
    const radius = 6 * this.pixelRatio

    // Glow effect for points
    this.ctx.shadowColor = color
    this.ctx.shadowBlur = 8 * this.pixelRatio

    map.forEach((point) => {
      if (typeof point.score === 'number' && point.score < 0.3) {
        return
      }

      // Outer glow circle
      this.ctx.beginPath()
      this.ctx.fillStyle = color
      this.ctx.arc(point.x * this.pixelRatio, point.y * this.pixelRatio, radius, 0, Math.PI * 2)
      this.ctx.fill()

      // Inner white dot
      this.ctx.beginPath()
      this.ctx.fillStyle = COLORS.point
      this.ctx.arc(point.x * this.pixelRatio, point.y * this.pixelRatio, radius * 0.5, 0, Math.PI * 2)
      this.ctx.fill()
    })

    // Reset shadow
    this.ctx.shadowBlur = 0
  }

  #drawFlash() {
    if (this.flashAlpha <= 0) {
      return
    }

    // Green celebration flash
    this.ctx.fillStyle = `rgba(94, 243, 140, ${this.flashAlpha * 0.3})`
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.flashAlpha = Math.max(0, this.flashAlpha - 0.03)
  }

  #toMap(keypoints) {
    const map = new Map()
    keypoints.forEach((keypoint) => {
      if (keypoint && typeof keypoint.x === 'number' && typeof keypoint.y === 'number') {
        map.set(keypoint.name ?? keypoint.part, {
          x: keypoint.x,
          y: keypoint.y,
          score: keypoint.score ?? keypoint.confidence ?? 0
        })
      }
    })
    return map
  }
}
