import { supabase } from './supabase'

// Types
export interface Doctor {
    id: string
    name: string
    email: string
    phone?: string
    specialization?: string
    status: string
    patientCount?: number
    created_at?: string
}

export interface Patient {
    id: string
    name: string
    email: string
    phone?: string
    doctor_id?: string
    doctor_name?: string
    created_at?: string
}

export interface DashboardStats {
    totalDoctors: number
    totalPatients: number
    totalSessions: number
    activeUsers: number
}

export interface WeeklyData {
    day: string
    count: number
}

// Fetch Dashboard Stats
export async function fetchDashboardStats(): Promise<DashboardStats> {
    const [doctorsRes, patientsRes, sessionsRes, activeRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }).eq('role', 'doctor'),
        supabase.from('users').select('id', { count: 'exact' }).eq('role', 'patient'),
        supabase.from('sessions').select('id', { count: 'exact' }),
        supabase.from('sessions').select('id', { count: 'exact' }).gte('started_at', new Date().toISOString().split('T')[0])
    ])

    return {
        totalDoctors: doctorsRes.count || 0,
        totalPatients: patientsRes.count || 0,
        totalSessions: sessionsRes.count || 0,
        activeUsers: activeRes.count || 0
    }
}

// Fetch Patient Growth (last 7 days)
export async function fetchPatientGrowth(): Promise<WeeklyData[]> {
    const days: WeeklyData[] = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        const { count } = await supabase
            .from('users')
            .select('id', { count: 'exact' })
            .eq('role', 'patient')
            .gte('created_at', dateStr)
            .lt('created_at', nextDate.toISOString().split('T')[0])

        days.push({
            day: dayNames[date.getDay()],
            count: count || 0
        })
    }

    return days
}

// Fetch Top Doctors (by patient count)
export async function fetchTopDoctors(): Promise<{ name: string; patients: number }[]> {
    const { data: doctors } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'doctor')

    if (!doctors) return []

    const topDoctors = await Promise.all(
        doctors.map(async (doc) => {
            const { count } = await supabase
                .from('assignments')
                .select('id', { count: 'exact' })
                .eq('doctor_id', doc.id)

            return { name: doc.name, patients: count || 0 }
        })
    )

    return topDoctors.sort((a, b) => b.patients - a.patients).slice(0, 5)
}

// Fetch All Doctors
export async function fetchDoctors(): Promise<Doctor[]> {
    const { data: doctors, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'doctor')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching doctors:', error)
        return []
    }

    if (!doctors) return []

    // Get patient counts by counting users with matching doctor_id
    const doctorsWithCounts = await Promise.all(
        doctors.map(async (doc) => {
            const { count, error } = await supabase
                .from('users')
                .select('id', { count: 'exact' })
                .eq('role', 'patient')
                .eq('doctor_id', doc.id)

            if (error) {
                console.error(`Error fetching patient count for doctor ${doc.id}:`, error)
            }

            return {
                ...doc,
                patientCount: count || 0
            }
        })
    )

    return doctorsWithCounts
}

// Add Doctor
export async function addDoctor(doctor: { name: string; email: string; phone?: string; specialization?: string; password: string }): Promise<{ success: boolean; error?: string }> {
    // Hash password (simple SHA-256 for demo)
    const encoder = new TextEncoder()
    const data = encoder.encode(doctor.password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const { error } = await supabase.from('users').insert({
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone || null,
        specialization: doctor.specialization || null,
        role: 'doctor',
        status: 'active',
        password: hashedPassword
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
}

// Update Doctor Status
export async function updateDoctorStatus(id: string, status: string): Promise<{ success: boolean }> {
    const { error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', id)

    return { success: !error }
}

// Delete Doctor
export async function deleteDoctor(id: string): Promise<{ success: boolean }> {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

    return { success: !error }
}

// Fetch All Patients with Doctor Info
export async function fetchPatients(): Promise<Patient[]> {
    const { data: patients } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'patient')
        .order('created_at', { ascending: false })

    if (!patients) return []

    // Get doctor names for assigned patients
    const patientsWithDoctors = await Promise.all(
        patients.map(async (patient) => {
            let doctor_name = 'Unassigned'
            if (patient.doctor_id) {
                const { data: doctor } = await supabase
                    .from('users')
                    .select('name')
                    .eq('id', patient.doctor_id)
                    .single()
                doctor_name = doctor?.name || 'Unknown'
            }

            return {
                ...patient,
                doctor_name
            }
        })
    )

    return patientsWithDoctors
}

// Add Patient
export async function addPatient(patient: { name: string; email: string; phone?: string; password: string; doctor_id?: string }): Promise<{ success: boolean; error?: string }> {
    // Hash password
    const encoder = new TextEncoder()
    const data = encoder.encode(patient.password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const { data: newPatient, error } = await supabase.from('users').insert({
        name: patient.name,
        email: patient.email,
        phone: patient.phone || null,
        role: 'patient',
        status: 'active',
        password: hashedPassword
    }).select().single()

    if (error) return { success: false, error: error.message }

    // Create assignment if doctor selected
    if (patient.doctor_id && newPatient) {
        await supabase.from('assignments').insert({
            doctor_id: patient.doctor_id,
            patient_id: newPatient.id
        })
    }

    return { success: true }
}

// Assign Doctor to Patient
export async function assignDoctor(patientId: string, doctorId: string): Promise<{ success: boolean }> {
    // Update the doctor_id column on the users table
    const { error: updateError } = await supabase
        .from('users')
        .update({ doctor_id: doctorId || null })
        .eq('id', patientId)

    if (updateError) {
        console.error('Error updating user doctor_id:', updateError)
        return { success: false }
    }

    // Remove any existing assignment for this patient
    await supabase
        .from('assignments')
        .delete()
        .eq('patient_id', patientId)

    // Create new assignment if doctor is selected
    if (doctorId) {
        const { error: assignError } = await supabase.from('assignments').insert({
            doctor_id: doctorId,
            patient_id: patientId
        })

        if (assignError) {
            console.error('Error creating assignment:', assignError)
        }
    }

    return { success: true }
}

// Delete Patient
export async function deletePatient(id: string): Promise<{ success: boolean }> {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

    return { success: !error }
}

// Fetch Reports Data
export async function fetchReportsData() {
    const [doctors, patients, sessions] = await Promise.all([
        fetchDoctors(),
        fetchPatients(),
        supabase.from('sessions').select('*').order('started_at', { ascending: false }).limit(100)
    ])

    // Calculate doctor performance
    const doctorPerformance = doctors.slice(0, 5).map(doc => ({
        name: doc.name,
        patients: doc.patientCount || 0,
        sessions: Math.floor(Math.random() * 50) + 10, // Demo data
        rating: (Math.random() * 2 + 3).toFixed(1)
    }))

    // Weekly stats
    const weeklyStats = {
        newPatients: patients.filter(p => {
            if (!p.created_at) return false
            const created = new Date(p.created_at)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return created >= weekAgo
        }).length,
        sessions: sessions.data?.length || 0,
        avgSessionTime: '25 min'
    }

    return { doctorPerformance, weeklyStats, totalPatients: patients.length }
}
