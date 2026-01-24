import * as poseDetection from '@tensorflow-models/pose-detection'
import * as tf from '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'

export class PoseEngine {
  constructor(videoElement) {
    this.videoElement = videoElement
    this.detector = null
    this.backendReady = false
  }

  async init() {
    if (this.detector) {
      return this.detector
    }

    await tf.ready()
    if (tf.getBackend() !== 'webgl') {
      await tf.setBackend('webgl')
    }

    this.backendReady = true

    this.detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
        minPoseScore: 0.25
      }
    )

    return this.detector
  }

  async estimate() {
    if (!this.detector || !this.videoElement) {
      return []
    }

    return this.detector.estimatePoses(this.videoElement, {
      maxPoses: 1,
      flipHorizontal: false
    })
  }

  async dispose() {
    if (this.detector && typeof this.detector.dispose === 'function') {
      await this.detector.dispose()
    }

    this.detector = null
  }
}
