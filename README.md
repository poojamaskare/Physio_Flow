# PhysioFlow 🧠🏃‍♂️  
**AI-Powered Smart Rehabilitation Platform**

PhysioFlow is an AI-driven physiotherapy and rehabilitation platform designed to help patients perform exercises accurately at home while enabling doctors to monitor progress, manage appointments, and deliver data-driven care.

The platform combines **pose detection**, **real-time feedback**, **exercise analytics**, and an **AI voice call agent powered by Retell AI** to create a seamless digital rehabilitation experience.

---

## 🚀 Features

### 👩‍⚕️ Doctor Dashboard
- Upload reference exercise videos
- Configure exercise plans (sets, reps, accuracy thresholds)
- View patient progress reports and performance analytics
- Manage appointments and availability
- Set leave periods with reasons (Active / On Leave status)
- Access patient exercise history and accuracy trends

### 🧑‍🦽 Patient Dashboard
- Guided physiotherapy exercise sessions
- Real-time posture detection and accuracy scoring
- Set-wise exercise counting (sets & reps)
- Instant feedback and completion status
- Access assigned exercise videos and schedules
- Voice-based assistance for queries and guidance

---

## 🎥 AI Pose Detection
- Uses **MediaPipe / MoveNet** for real-time pose tracking
- Compares patient posture with doctor-uploaded reference videos
- Counts repetitions only when posture accuracy meets the defined threshold
- Prevents false counts due to incorrect or partial movements
- Supports mobile and desktop camera input

---

## 📞 AI Voice Call Agent (Powered by Retell AI)

PhysioFlow includes an **AI Voice Call Agent built using Retell AI** to assist patients via voice calls.

### Voice Agent Capabilities
- Answers common patient queries:
  - How to perform assigned exercises
  - Exercise schedule and session guidance
  - Accuracy, sets, and repetition rules
  - Appointment details and reminders
- Guides patients through rehabilitation workflows
- Provides calm, friendly, and professional responses
- Uses a predefined **knowledge base** for safe and accurate answers

### Smart Call Transfer
- Automatically transfers the call to the doctor when:
  - A critical medical query is detected
  - The patient explicitly requests to talk to a doctor
  - The question is outside the AI agent’s knowledge scope
- Ensures no medical advice is given beyond the configured knowledge base

---

## 📊 Reports & Analytics
- Session-wise exercise performance
- Accuracy trends over time
- Set & repetition completion stats
- Patient adherence and consistency tracking
- Downloadable reports for clinical review

---

## 📱 Responsive Design
- Fully responsive for **mobile, tablet, and desktop**
- Mobile-first UI approach
- Touch-friendly controls
- Optimized camera and exercise screens for smaller devices
- Consistent behavior across all screen sizes

---

## 🧠 Technology Stack

### Frontend
- React
- Next.js
- Tailwind CSS / CSS Modules
- MediaPipe / TensorFlow.js

### Backend
- Node.js
- Supabase (Auth, Database, Storage)
- REST / Webhooks

### AI & Voice
- MediaPipe / MoveNet (Pose Detection)
- Retell AI (Voice Call Agent)

### DevOps
- Docker
- Ngrok (Webhooks & local testing)

---

## 🔐 Security & Privacy
- Secure authentication using Supabase Auth
- Role-based access (Doctor / Patient / Admin)
- Encrypted data storage
- No unauthorized access to medical data
- Voice agent restricted to approved knowledge base

---

## 🛠️ Installation & Setup

```bash
# Clone the repository
git clone https://github.com/your-username/physioflow.git

# Install dependencies
npm install

# Run the development server
npm run dev
