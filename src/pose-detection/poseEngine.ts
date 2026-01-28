// This file must be dynamically imported with 'use client' to avoid SSR issues
// with @tensorflow-models/pose-detection and @mediapipe/pose

let poseDetection: any = null;
let tf: any = null;

export class PoseEngine {
    private videoElement: HTMLVideoElement;
    private detector: any = null;
    private backendReady: boolean = false;

    constructor(videoElement: HTMLVideoElement) {
        this.videoElement = videoElement;
    }

    async init() {
        if (this.detector) {
            return this.detector;
        }

        // Dynamic imports to avoid SSR bundling issues
        if (!tf) {
            tf = await import('@tensorflow/tfjs-core');
            await import('@tensorflow/tfjs-backend-webgl');
        }

        await tf.ready();
        if (tf.getBackend() !== 'webgl') {
            await tf.setBackend('webgl');
        }

        this.backendReady = true;

        // Dynamically import pose detection to avoid @mediapipe/pose import at build time
        if (!poseDetection) {
            poseDetection = await import('@tensorflow-models/pose-detection');
        }

        this.detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            {
                modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
                enableSmoothing: true,
                minPoseScore: 0.25
            }
        );

        return this.detector;
    }

    async estimate() {
        if (!this.detector || !this.videoElement) {
            return [];
        }

        return this.detector.estimatePoses(this.videoElement, {
            maxPoses: 1,
            flipHorizontal: false
        });
    }

    async dispose() {
        if (this.detector && typeof this.detector.dispose === 'function') {
            await this.detector.dispose();
        }

        this.detector = null;
    }
}
