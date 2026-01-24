import { PoseEngine } from './poseEngine.js'
import { PoseRenderer } from './poseRenderer.js'
import { PoseAnalyzer } from './poseAnalyzer.js'
import { defaultExercise } from './exerciseConfig.js'

export class PoseCoachApp {
  constructor(root) {
    this.root = root
    this.canvas = null
    this.cameraVideo = null
    this.referenceVideo = null
    this.referencePicker = null
    this.startButton = null
    this.stopButton = null
    this.repCounter = null
    this.feedbackText = null
    this.handleResize = this.#handleResize.bind(this)

    this.poseRenderer = null
    this.poseEngine = null
    this.referencePoseEngine = null
    this.poseAnalyzer = new PoseAnalyzer(defaultExercise)

    this.sessionActive = false
    this.detectionHandle = null
    this.videoStream = null
    this.referenceUrl = null

    // Rep counting
    this.repCount = 0
    this.poseHoldFrames = 0
    this.poseBreakFrames = 0
    this.repCounted = false

    // Reference pose storage
    this.currentReferencePose = null
    this.currentFeedback = ''
    this.feedbackDebounceTimer = null
    this.lastFeedbackUpdate = 0
  }

  async init() {
    this.#renderShell()
    this.#cacheElements()
    this.poseRenderer = new PoseRenderer(this.canvas)
    this.#bindUI()
    window.addEventListener('resize', this.handleResize)
    this.#handleResize()
  }

  #renderShell() {
    this.root.innerHTML = `
      <div class="exercise-fullscreen">
        <!-- User Camera (FULLSCREEN) -->
        <video id="cameraStream" class="camera-fullscreen" autoplay playsinline muted></video>
        <canvas id="poseCanvas" class="pose-canvas-fullscreen"></canvas>
        
        <!-- Placeholder when camera not active -->
        <div class="camera-placeholder" id="cameraPlaceholder">
          <div class="placeholder-content">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            <p>Click "Start" to begin your exercise session</p>
          </div>
        </div>

        <!-- Reference Video (Top Right Corner - Small) -->
        <div class="reference-pip" id="referencePip">
          <video id="referenceVideo" class="reference-video" playsinline loop muted></video>
          <div class="reference-label">Exercise Demo</div>
          <div class="no-video-message" id="noVideoMessage">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polygon points="5,3 19,12 5,21"></polygon>
            </svg>
            <span>Upload video</span>
          </div>
        </div>

        <!-- Repetition Counter -->
        <div class="rep-counter" id="repCounter">
          <span class="rep-label">REPS</span>
          <span class="rep-value" id="repValue">0</span>
        </div>

        <!-- Floating Feedback Message -->
        <div class="feedback-float" id="feedbackFloat">
          <div class="feedback-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <p class="feedback-text" id="feedbackText">Get ready to start!</p>
        </div>

        <!-- Floating Controls -->
        <div class="floating-controls">
          <label class="upload-btn">
            <input type="file" id="referencePicker" accept="video/*" />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17,8 12,3 7,8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>Upload Video</span>
          </label>
          <button class="control-btn primary" id="startSession">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5,3 19,12 5,21"></polygon>
            </svg>
            <span>Start</span>
          </button>
          <button class="control-btn ghost" id="stopSession" disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="6" y="6" width="12" height="12"></rect>
            </svg>
            <span>Stop</span>
          </button>
        </div>

        <!-- Status Indicator -->
        <div class="status-indicator" id="statusIndicator">
          <span class="status-dot"></span>
          <span class="status-text">Ready</span>
        </div>
      </div>
    `
  }

  #cacheElements() {
    this.canvas = this.root.querySelector('#poseCanvas')
    this.cameraVideo = this.root.querySelector('#cameraStream')
    this.referenceVideo = this.root.querySelector('#referenceVideo')
    this.referencePicker = this.root.querySelector('#referencePicker')
    this.startButton = this.root.querySelector('#startSession')
    this.stopButton = this.root.querySelector('#stopSession')
    this.repCounter = this.root.querySelector('#repValue')
    this.referencePip = this.root.querySelector('#referencePip')
    this.cameraPlaceholder = this.root.querySelector('#cameraPlaceholder')
    this.statusIndicator = this.root.querySelector('#statusIndicator')
    this.feedbackFloat = this.root.querySelector('#feedbackFloat')
    this.feedbackText = this.root.querySelector('#feedbackText')
    this.noVideoMessage = this.root.querySelector('#noVideoMessage')
  }

  #bindUI() {
    this.startButton.addEventListener('click', () => this.#startSession())
    this.stopButton.addEventListener('click', () => this.#stopSession())

    this.referencePicker.addEventListener('change', (event) => {
      const file = event.target.files?.[0]
      if (!file) {
        return
      }
      this.#loadReferenceVideo(file)
    })
  }

  async #startSession() {
    if (this.sessionActive) {
      return
    }

    try {
      this.sessionActive = true
      this.startButton.disabled = true
      this.stopButton.disabled = false
      this.#updateStatus('Calibrating...', 'calibrating')
      this.#updateFeedback('Starting camera...', 'info')

      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false
      })

      this.cameraVideo.srcObject = this.videoStream
      await this.cameraVideo.play().catch(() => { })
      await this.#waitForVideoReady(this.cameraVideo)

      // Hide placeholder, show camera
      this.cameraPlaceholder.classList.add('hidden')
      this.cameraVideo.classList.add('active')
      this.canvas.classList.add('active')
      this.#handleResize()

      // Initialize pose engine for user camera
      this.poseEngine = new PoseEngine(this.cameraVideo)
      await this.poseEngine.init()

      // Initialize reference video pose engine if video loaded
      if (this.referenceVideo.src && this.referenceVideo.readyState >= 2) {
        this.referencePoseEngine = new PoseEngine(this.referenceVideo)
        await this.referencePoseEngine.init()
        this.referenceVideo.play().catch(() => { })
      }

      this.#resetSession()
      this.#updateStatus('Active', 'active')
      this.#updateFeedback('Position yourself in the frame and follow the exercise video', 'info')
      this.#scheduleDetectionLoop()
    } catch (error) {
      console.error(error)
      this.#updateStatus('Camera access needed', 'error')
      this.#updateFeedback('Please allow camera access to continue', 'error')
      this.sessionActive = false
      this.startButton.disabled = false
      this.stopButton.disabled = true
    }
  }

  async #stopSession() {
    if (!this.sessionActive) {
      return
    }

    this.sessionActive = false
    this.startButton.disabled = false
    this.stopButton.disabled = true
    this.cameraPlaceholder.classList.remove('hidden')
    this.cameraVideo.classList.remove('active')
    this.canvas.classList.remove('active')
    this.#updateStatus('Ready', 'ready')
    this.#updateFeedback('Session ended. Great work!', 'success')

    if (this.videoStream) {
      this.videoStream.getTracks().forEach((track) => track.stop())
      this.videoStream = null
    }

    if (this.poseEngine) {
      await this.poseEngine.dispose()
      this.poseEngine = null
    }

    if (this.referencePoseEngine) {
      await this.referencePoseEngine.dispose()
      this.referencePoseEngine = null
    }

    if (this.detectionHandle) {
      cancelAnimationFrame(this.detectionHandle)
      this.detectionHandle = null
    }

    if (this.referenceVideo) {
      this.referenceVideo.pause()
    }
  }

  #scheduleDetectionLoop() {
    const loop = async () => {
      if (!this.sessionActive || !this.poseEngine) {
        return
      }

      try {
        // Get user's pose
        const userPoses = await this.poseEngine.estimate()

        // Get reference video pose if available
        if (this.referencePoseEngine && this.referenceVideo.readyState >= 2) {
          const refPoses = await this.referencePoseEngine.estimate()
          if (refPoses?.length) {
            this.currentReferencePose = refPoses[0]
          }
        }

        if (userPoses?.length) {
          this.#handlePose(userPoses[0])
        }
      } catch (error) {
        console.error('Pose estimation error', error)
      }

      if (this.sessionActive) {
        this.detectionHandle = requestAnimationFrame(loop)
      }
    }

    this.detectionHandle = requestAnimationFrame(loop)
  }

  #handlePose(userPose) {
    const displayKeypoints = this.#scaleKeypoints(userPose.keypoints)

    let isCorrect = false
    let feedbackMessage = ''

    if (this.currentReferencePose) {
      // Compare user pose with reference pose
      const comparison = this.poseAnalyzer.comparePosesWithFeedback(
        userPose.keypoints,
        this.currentReferencePose.keypoints
      )
      isCorrect = comparison.isCorrect
      feedbackMessage = comparison.feedback

      // Debug logging - helps see if detection is working
      if (comparison.similarity !== undefined) {
        console.log('Similarity:', (comparison.similarity * 100).toFixed(1) + '%', isCorrect ? '✓ GREEN' : '✗ RED')
      }
    } else {
      // Fallback to default exercise evaluation
      const analysis = this.poseAnalyzer.evaluate(userPose.keypoints)
      isCorrect = analysis.allSegmentsHit && analysis.accuracy >= 0.60  // Lowered from 0.70
      feedbackMessage = analysis.message
    }

    // Render skeleton with color based on correctness
    this.poseRenderer.renderSimple(displayKeypoints, isCorrect)

    // Update floating feedback with debouncing (only update every 600ms to prevent flickering)
    const now = Date.now()
    if (now - this.lastFeedbackUpdate > 600) {
      if (isCorrect) {
        this.#updateFeedback('Perfect! Keep holding this pose! 💪', 'success')
      } else if (feedbackMessage) {
        this.#updateFeedback(feedbackMessage, 'warning')
      }
      this.lastFeedbackUpdate = now
    }

    // Rep counting logic
    this.#updateRepCount(isCorrect)
  }

  #updateRepCount(isCorrect) {
    // Detect state transitions for rep counting
    // A rep is counted when you go: correct pose (green) -> incorrect pose (red)
    // This represents completing the exercise movement and returning to start

    if (isCorrect) {
      this.poseHoldFrames++
      this.poseBreakFrames = 0

      // Mark that we've achieved the correct pose (green)
      // Need at least 8 frames of green to count as a valid pose achievement
      if (this.poseHoldFrames >= 8 && !this.repCounted) {
        this.repCounted = true  // Mark that we've hit the target pose
        console.log('✓ Target pose achieved - waiting for return movement')
      }
    } else {
      // Pose is incorrect (red)
      this.poseBreakFrames++

      // Count the rep when returning from green to red
      // This means the user completed the exercise movement
      if (this.repCounted && this.poseBreakFrames >= 5) {
        this.repCount++
        this.repCounter.textContent = this.repCount
        this.poseRenderer.triggerCelebration()
        this.#updateFeedback(`Excellent! Rep ${this.repCount} completed! 🎉`, 'success')
        this.lastFeedbackUpdate = Date.now()
        console.log('✓ Rep counted:', this.repCount, '(completed full movement)')

        // Reset for next rep
        this.repCounted = false
        this.poseHoldFrames = 0
      }

      // Reset hold frames when pose breaks
      if (this.poseBreakFrames > 3) {
        this.poseHoldFrames = 0
      }
    }
  }

  #loadReferenceVideo(file) {
    if (this.referenceUrl) {
      URL.revokeObjectURL(this.referenceUrl)
    }
    this.referenceUrl = URL.createObjectURL(file)
    this.referenceVideo.src = this.referenceUrl
    this.referenceVideo.play().catch(() => { })

    // Hide "no video" message, show video
    this.noVideoMessage.classList.add('hidden')
    this.referenceVideo.classList.add('loaded')
    this.#updateFeedback(`Loaded: ${file.name}. Click Start to begin!`, 'info')
  }

  #updateStatus(text, state) {
    const indicator = this.statusIndicator
    if (!indicator) return

    indicator.querySelector('.status-text').textContent = text
    indicator.dataset.state = state
  }

  #updateFeedback(text, type = 'info') {
    if (!this.feedbackFloat || !this.feedbackText) return

    this.feedbackText.textContent = text
    this.feedbackFloat.dataset.type = type
  }

  #resetSession() {
    this.repCount = 0
    this.poseHoldFrames = 0
    this.poseBreakFrames = 0
    this.repCounted = false
    this.currentReferencePose = null
    this.repCounter.textContent = '0'
    this.lastFeedbackUpdate = 0
    console.log('Session reset')
  }

  async #waitForVideoReady(video) {
    if (!video) {
      return
    }
    if (video.readyState >= 2 && video.videoWidth) {
      return
    }
    await new Promise((resolve) => {
      video.addEventListener('loadeddata', resolve, { once: true })
    })
  }

  #handleResize() {
    const container = this.root.querySelector('.exercise-fullscreen')
    if (!container || !this.poseRenderer) {
      return
    }
    const rect = container.getBoundingClientRect()
    if (!rect.width || !rect.height) {
      return
    }
    this.poseRenderer.resize(rect.width, rect.height)
  }

  #scaleKeypoints(keypoints = []) {
    const container = this.root.querySelector('.exercise-fullscreen')?.getBoundingClientRect() || { width: 0, height: 0 }
    const video = this.#getVideoSize()

    if (!container.width || !container.height || !video.width || !video.height) {
      return keypoints
    }

    const scale = Math.max(container.width / video.width, container.height / video.height)
    const displayedWidth = video.width * scale
    const displayedHeight = video.height * scale
    const offsetX = (displayedWidth - container.width) / 2
    const offsetY = (displayedHeight - container.height) / 2

    return keypoints.map((keypoint) => {
      if (!keypoint) {
        return keypoint
      }
      const x = keypoint.x * scale - offsetX
      const y = keypoint.y * scale - offsetY
      return {
        ...keypoint,
        x: Math.min(Math.max(x, -32), container.width + 32),
        y: Math.min(Math.max(y, -32), container.height + 32)
      }
    })
  }

  #getVideoSize() {
    if (!this.cameraVideo) {
      return { width: 0, height: 0 }
    }
    return {
      width: this.cameraVideo.videoWidth || this.cameraVideo.clientWidth || 0,
      height: this.cameraVideo.videoHeight || this.cameraVideo.clientHeight || 0
    }
  }
}
