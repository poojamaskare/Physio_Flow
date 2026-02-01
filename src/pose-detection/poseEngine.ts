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

    async init(useLightning: boolean = false) {
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

        // Try Thunder first (more accurate), fall back to Lightning (faster & smaller)
        const modelType = useLightning
            ? poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
            : poseDetection.movenet.modelType.SINGLEPOSE_THUNDER;

        try {
            console.log(`Loading MoveNet ${useLightning ? 'Lightning' : 'Thunder'}...`);
            this.detector = await poseDetection.createDetector(
                poseDetection.SupportedModels.MoveNet,
                {
                    modelType: modelType,
                    enableSmoothing: true,
                    minPoseScore: 0.25
                }
            );
            console.log('Pose detector loaded successfully');
        } catch (error) {
            console.warn('Failed to load primary model (Thunder), attempting fallback:', error);

            // If Thunder failed, try Lightning as fallback
            if (!useLightning) {
                console.log('Retrying with Lightning model (smaller, faster)...');
                this.detector = await poseDetection.createDetector(
                    poseDetection.SupportedModels.MoveNet,
                    {
                        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
                        enableSmoothing: true,
                        minPoseScore: 0.25
                    }
                );
                console.log('Lightning model loaded as fallback');
            } else {
                throw error; // Re-throw if Lightning also failed
            }
        }

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
