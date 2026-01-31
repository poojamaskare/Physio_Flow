 AI-Powered Physiotherapy Platform

## Overview
Mudra is an advanced tele-rehabilitation platform that uses computer vision and AI to assist patients in performing physiotherapy exercises correctly at home. It allows doctors to assign custom exercises via video, automatically extracts movement templates, and provides patients with real-time feedback on their form, rep counting, and progress tracking.

The system leverages TensorFlow.js for in-browser pose estimation, ensuring patient privacy (video feeds are processed locally) and low latency.

## Key Features

### For Doctors
- **Patient Management**: Add and manage patients, view their adherence and progress.
- **Custom Exercise Library**: Upload reference videos of specific exercises.
- **AI Template Extraction**: The system automatically analyzes uploaded videos to identify "Start" and "Peak" movement phases and calculating meaningful joint angles (e.g., elbow flexion, shoulder abduction).
- **Prescription**: Assign specific sets, reps, and difficulty levels to patients.

### For Patients
- **Interactive Exercise Session**: Real-time camera feed with skeleton overlay.
- **AI Form Correction**: Instant validation of movements against the doctor's reference template.
- **Auto Rep Counting**: Smart repetition counting based on phase completion (Start -> Peak -> Start).
- **Voice Feedback**: Real-time audio cues ("Great form!", "Straighten your elbow") to guide the patient.
- **Progress Tracking**: Weekly activity charts, streaks, and completion statistics.
- **Gamification**: Visual celebrations and streaks to maintain motivation.

## Technical Architecture

### Core Stack
- **Framework**: Next.js 14+ (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: TailwindCSS (Custom design system, minimal external libraries)
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security)
- **Storage**: Supabase Storage (for reference videos)

### AI & Computer Vision
- **Model**: TensorFlow.js (MoveNet algorithms - Lightning/Thunder variants)
- **Processing**: Client-side execution (runs in the browser, no video upload to server for inference).
- **Logic**:
    - **Angle Extraction**: Calculates vector angles between key body landmarks (shoulders, elbows, hips, knees).
    - **Phase Matching**: Compares live user angles against stored template phases using weighted similarity scores.
    - **Smoothing**: Applies temporal smoothing to keypoints to reduce jitter.

## Core Logic Explanation

### 1. Template Extraction w
When a doctor uploads a video:
1. The system samples frames from the video.
2. It detects poses in each frame using MoveNet.
3. It calculates min/max angles for relevant joints.
4. It identifies two key phases:
   - **Start Phase**: The resting position (e.g., arm down).
   - **Peak Phase**: The point of maximum contraction/extension (e.g., arm curled up).
5. It saves these phase definitions (target angles + tolerance) to the database.

### 2. Live Exercise Engine (`src/app/exercise/page.tsx`)
During a patient session:
1. **Detection**: Captures webcam stream and runs MoveNet inference.
2. **Normalization**: Scales user's body size to match the frame reference.
3. **Matching**: Compares current angles to the active exercise's template.
   - **Green Skeleton**: User matches the current target phase (within ~30 degree tolerance).
   - **Red Skeleton**: User is out of position.
4. **State Machine**: Tracks the sequence of phases. A repetition is counted ONLY when the user completes the cycle: `Start -> Peak -> Start`.
5. **Feedback**: Triggers audio and visual cues based on successful phase matches.

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- A Supabase account

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure
- `/src/app`: Next.js pages and layouts (Routes for /doctor, /patient, /exercise)
- `/src/components`: UI components (Sidebar, Dashboard cards, Charts)
- `/src/lib`: Utilities (Supabase client, Template extraction logic, Voice feedback)
- `/src/pose-detection`: Core AI logic classes (PoseEngine, PoseRenderer)
