/**
 * Voice Feedback Utility
 * Uses browser's built-in SpeechSynthesis API for real-time exercise feedback
 */

let lastSpokenTime = 0
const MIN_INTERVAL_MS = 3000 // Minimum 3 seconds between voice prompts
let isMuted = false

/**
 * Speak a message using browser's speech synthesis
 * Automatically throttled to prevent spam
 */
function speak(message: string, priority: boolean = false): void {
    if (isMuted) return

    const now = Date.now()
    if (!priority && now - lastSpokenTime < MIN_INTERVAL_MS) return

    // Cancel any ongoing speech
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(message)
    utterance.rate = 1.1 // Slightly faster
    utterance.pitch = 1.0
    utterance.volume = 0.8

    // Use a friendly voice if available
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(v =>
        v.name.includes('Samantha') ||
        v.name.includes('Google') ||
        v.lang.startsWith('en')
    )
    if (preferredVoice) {
        utterance.voice = preferredVoice
    }

    window.speechSynthesis.speak(utterance)
    lastSpokenTime = now
}

// ============ Public API ============

/**
 * Called when user completes a rep
 */
export function sayRepComplete(currentRep: number, targetReps: number): void {
    const remaining = targetReps - currentRep

    if (remaining === 0) {
        speak("Set complete! Great work!", true)
    } else if (remaining <= 3) {
        speak(`${remaining} more to go!`)
    } else if (currentRep === 1) {
        speak("Good start!")
    } else if (currentRep % 5 === 0) {
        speak(`${currentRep} reps done!`)
    }
}

/**
 * Called when user completes a set
 */
export function saySetComplete(currentSet: number, totalSets: number): void {
    if (currentSet >= totalSets) {
        speak("Excellent! All sets complete!", true)
    } else {
        speak(`Set ${currentSet} done! ${totalSets - currentSet} sets remaining.`, true)
    }
}

/**
 * Called when form needs correction
 */
export function sayFormCorrection(issue: string): void {
    const corrections: Record<string, string> = {
        'elbow': 'Keep your elbow straight',
        'shoulder': 'Raise your shoulder higher',
        'knee': 'Bend your knee more',
        'back': 'Keep your back straight',
        'default': 'Adjust your form'
    }
    speak(corrections[issue] || corrections['default'])
}

/**
 * Called when user's form is good
 */
export function sayGoodForm(): void {
    const phrases = [
        "Great form!",
        "Looking good!",
        "Perfect!",
        "Keep it up!"
    ]
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)]
    speak(randomPhrase)
}

/**
 * Called when session starts
 */
export function saySessionStart(exerciseName: string): void {
    speak(`Starting ${exerciseName}. Get ready!`, true)
}

/**
 * Toggle mute state
 */
export function toggleMute(): boolean {
    isMuted = !isMuted
    if (isMuted) {
        window.speechSynthesis.cancel()
    }
    return isMuted
}

/**
 * Check if muted
 */
export function isMutedState(): boolean {
    return isMuted
}

/**
 * Set mute state
 */
export function setMuted(muted: boolean): void {
    isMuted = muted
    if (isMuted) {
        window.speechSynthesis.cancel()
    }
}
