// Shim for @mediapipe/pose - provides empty exports for MoveNet (which doesn't use MediaPipe)
// MoveNet uses TensorFlow.js directly, so these are just placeholders

export class Pose {
    constructor(config) {
        this.config = config;
    }

    initialize() {
        return Promise.resolve();
    }

    reset() { }

    close() { }

    onResults(callback) {
        this.resultsCallback = callback;
    }

    send(input) {
        return Promise.resolve();
    }

    setOptions(options) { }
}

export const POSE_CONNECTIONS = [];
export const POSE_LANDMARKS = {};
export const POSE_LANDMARKS_LEFT = {};
export const POSE_LANDMARKS_RIGHT = {};
export const POSE_LANDMARKS_NEUTRAL = {};

export const VERSION = '0.5.1675469404';

export default Pose;
