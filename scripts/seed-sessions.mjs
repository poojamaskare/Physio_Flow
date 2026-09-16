// One-off seed script: populates realistic `sessions` rows for a patient
// so the dashboard's Biometrics Telemetry Logs / ProgressChart have data to render.
// Usage: node scripts/seed-sessions.mjs "Patient Name"

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

function loadEnvLocal() {
  const text = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match) env[match[1]] = match[2].trim()
  }
  return env
}

const env = loadEnvLocal()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const patientName = process.argv[2] || 'Hitesh Shinde'

async function main() {
  const { data: patient, error: patientError } = await supabase
    .from('users')
    .select('id, name, role')
    .ilike('name', patientName)
    .eq('role', 'patient')
    .single()

  if (patientError || !patient) {
    console.error(`Could not find patient "${patientName}":`, patientError?.message)
    process.exit(1)
  }

  console.log(`Found patient: ${patient.name} (${patient.id})`)

  const { data: assignments, error: assignError } = await supabase
    .from('patient_exercises')
    .select('exercise_id, exercises(name)')
    .eq('patient_id', patient.id)

  if (assignError || !assignments || assignments.length === 0) {
    console.error('No assigned exercises found for this patient — assign exercises first.', assignError?.message)
    process.exit(1)
  }

  const exercises = assignments.map(a => ({ id: a.exercise_id, name: a.exercises?.name || 'Exercise' }))
  console.log(`Found ${exercises.length} assigned exercise(s):`, exercises.map(e => e.name).join(', '))

  // Build ~10 sessions over the last 18 days, accuracy trending upward, with a couple of missed days
  const daysAgoList = [17, 15, 14, 12, 10, 8, 6, 4, 2, 0]
  const rows = daysAgoList.map((daysAgo, i) => {
    const exercise = exercises[i % exercises.length]
    const progressFactor = i / (daysAgoList.length - 1) // 0 -> 1
    const baseAccuracy = 65 + Math.round(progressFactor * 28) // 65 -> 93
    const accuracy = Math.min(98, baseAccuracy + Math.round(Math.random() * 6 - 3))
    const duration = 180 + Math.round(Math.random() * 240) // 3-7 min in seconds

    const startedAt = new Date()
    startedAt.setDate(startedAt.getDate() - daysAgo)
    startedAt.setHours(8 + Math.round(Math.random() * 10), Math.round(Math.random() * 59), 0, 0)

    return {
      patient_id: patient.id,
      exercise_id: exercise.id,
      accuracy,
      duration,
      started_at: startedAt.toISOString()
    }
  })

  const { data: inserted, error: insertError } = await supabase
    .from('sessions')
    .insert(rows)
    .select('id, accuracy, duration, started_at')

  if (insertError) {
    console.error('Insert failed:', insertError.message)
    process.exit(1)
  }

  console.log(`\nInserted ${inserted.length} session rows for ${patient.name}:`)
  for (const row of inserted) {
    console.log(`  ${row.started_at.slice(0, 10)}  accuracy=${row.accuracy}%  duration=${row.duration}s`)
  }
}

main()
