import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Rehab voice coach. Each call rebuilds the patient's context from the DB so the model only
// ever knows about *this* patient, then appends the last 20 turns of their own history.
const MODEL = 'openai/gpt-oss-120b'
const HISTORY_TURNS = 20

async function buildContext(patientId: string) {
    const [{ data: p }, { data: assigns }, { data: sessions }] = await Promise.all([
        supabase.from('users').select('name, age, injury, diet_plan, doctor_id').eq('id', patientId).single(),
        supabase.from('patient_exercises').select('sets, reps_per_set, notes, status, completed, exercise:exercises(name, description)').eq('patient_id', patientId),
        supabase.from('sessions').select('accuracy, duration, started_at, exercise:exercises(name)').eq('patient_id', patientId).order('started_at', { ascending: false }).limit(10),
    ])
    if (!p) return null
    const { data: doc } = p.doctor_id ? await supabase.from('users').select('name').eq('id', p.doctor_id).single() : { data: null }

    type A = { sets: number; reps_per_set: number; notes?: string; status?: string; completed?: boolean; exercise?: { name: string; description?: string } | null }
    type S = { accuracy: number; duration: number; started_at: string; exercise?: { name: string } | null }
    const exerciseLines = ((assigns || []) as unknown as A[]).map(a =>
        `- ${a.exercise?.name || 'Exercise'}: ${a.sets} sets × ${a.reps_per_set} reps${a.notes ? ` (notes: ${a.notes})` : ''} — ${a.completed || a.status === 'completed' ? 'completed' : 'pending'}`
    ).join('\n') || '- none assigned yet'
    const sessionLines = ((sessions || []) as unknown as S[]).map(s =>
        `- ${new Date(s.started_at).toLocaleDateString()}: ${s.exercise?.name || 'session'}, accuracy ${s.accuracy}%, ${Math.round(s.duration / 60) || 1} min`
    ).join('\n') || '- no sessions recorded yet'

    return `You are the PhysioFlow Helper, a friendly voice assistant for a physiotherapy patient. Your replies are spoken aloud, so keep them short (1-3 sentences), conversational, and free of markdown, bullets or emojis.

PATIENT
Name: ${p.name}${p.age ? `, age ${p.age}` : ''}
Condition: ${p.injury || 'general recovery'}
Doctor: ${doc?.name || 'not assigned'}

ASSIGNED EXERCISES
${exerciseLines}

RECENT SESSIONS (newest first)
${sessionLines}

DIET PLAN (prescribed by the doctor)
${p.diet_plan || 'none assigned yet'}

RULES
- Only discuss this patient's own plan, exercises, progress and diet. You have no information about other patients.
- Encourage and guide; never change the prescription. For pain, new symptoms or medical questions, tell them to contact ${doc?.name || 'their doctor'}.
- If asked something outside rehab, nutrition or the app, politely steer back.
- Today is ${new Date().toDateString()}.`
}

export async function POST(req: NextRequest) {
    const { patientId, message } = await req.json().catch(() => ({}))
    if (!patientId || !message?.trim()) return NextResponse.json({ error: 'patientId and message required' }, { status: 400 })
    const key = process.env.GROQ_API_KEY
    if (!key) return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 })

    const system = await buildContext(patientId)
    if (!system) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

    const { data: history } = await supabase
        .from('coach_messages').select('role, content').eq('patient_id', patientId)
        .order('created_at', { ascending: false }).limit(HISTORY_TURNS)

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: MODEL,
            temperature: 0.5,
            max_tokens: 500,
            reasoning_effort: 'low',
            messages: [
                { role: 'system', content: system },
                ...(history || []).reverse(),
                { role: 'user', content: message },
            ],
        }),
    })
    if (!res.ok) return NextResponse.json({ error: `Groq ${res.status}: ${await res.text()}` }, { status: 502 })
    const reply: string = (await res.json()).choices?.[0]?.message?.content?.trim() || "Sorry, I didn't catch that."

    await supabase.from('coach_messages').insert([
        { patient_id: patientId, role: 'user', content: message },
        { patient_id: patientId, role: 'assistant', content: reply },
    ])
    return NextResponse.json({ reply })
}

export async function GET(req: NextRequest) {
    const patientId = req.nextUrl.searchParams.get('patientId')
    if (!patientId) return NextResponse.json({ messages: [] })
    const { data } = await supabase.from('coach_messages').select('role, content, created_at').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(HISTORY_TURNS)
    return NextResponse.json({ messages: (data || []).reverse() })
}

export async function DELETE(req: NextRequest) {
    const patientId = req.nextUrl.searchParams.get('patientId')
    if (!patientId) return NextResponse.json({ error: 'patientId required' }, { status: 400 })
    const { error } = await supabase.from('coach_messages').delete().eq('patient_id', patientId)
    return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true })
}
