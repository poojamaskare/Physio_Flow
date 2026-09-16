import { supabase } from './supabase'

export interface User {
    id: string
    email: string
    name: string
    role: 'doctor' | 'patient'
    phone?: string
    age?: number | null
    injury?: string
}

// Simple hash function for demo (not for production!)
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password + 'rehabai_salt')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Sign up - store user with password in database
export async function signUp(
    email: string,
    password: string,
    name: string,
    role: 'doctor' | 'patient',
    additionalData?: {
        phone?: string
        age?: number | null
        injury?: string
    }
) {
    // Check if email already exists
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

    if (existing) {
        throw new Error('Email already registered')
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate ID and insert
    const id = crypto.randomUUID()

    const { error } = await supabase.from('users').insert({
        id,
        email,
        name,
        role,
        password: hashedPassword,
        phone: additionalData?.phone || null,
        age: additionalData?.age || null,
        injury: additionalData?.injury || null
    })

    if (error) throw error

    // Store user in localStorage for session
    const user = { id, email, name, role }
    if (typeof window !== 'undefined') {
        localStorage.setItem('physioflow_user', JSON.stringify(user))
    }

    return { user }
}

// Sign in - verify password from database
export async function signIn(email: string, password: string) {
    const hashedPassword = await hashPassword(password)

    const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, phone, password')
        .eq('email', email)
        .single()

    if (error || !data) {
        throw new Error('Invalid email or password')
    }

    // Verify password
    if (data.password !== hashedPassword) {
        throw new Error('Invalid email or password')
    }

    // Store user in localStorage (without password)
    const user = { id: data.id, email: data.email, name: data.name, role: data.role, phone: data.phone }
    if (typeof window !== 'undefined') {
        localStorage.setItem('physioflow_user', JSON.stringify(user))
    }

    return { user }
}

// Sign out
export async function signOut() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('physioflow_user')
    }
    await supabase.auth.signOut().catch(() => {})
}

// Get current logged-in user
export async function getCurrentUser(): Promise<User | null> {
    // Only run on client side
    if (typeof window === 'undefined') {
        return null
    }

    try {
        const stored = localStorage.getItem('physioflow_user')
        if (!stored) {
            return null
        }

        const user = JSON.parse(stored)

        // Verify user still exists in database (optional refresh)
        // Skip verification for performance - trust localStorage
        // If you want stricter security, uncomment below:
        /*
        const { data, error } = await supabase
            .from('users')
            .select('id, email, name, role, phone')
            .eq('id', user.id)
            .single()

        if (error || !data) {
            localStorage.removeItem('physioflow_user')
            return null
        }

        // Update localStorage with fresh data
        localStorage.setItem('physioflow_user', JSON.stringify(data))
        return data
        */

        return user
    } catch (e) {
        console.error('Error getting current user:', e)
        return null
    }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
    const user = await getCurrentUser()
    return user !== null
}

// ── Google OAuth (via Supabase Auth) ─────────────────────────────
// The app keeps its own `users` table as the source of truth, so after Google
// returns we look the user up by email and mirror them into localStorage.

export async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
}

/** Returns the app user for the current Supabase Auth session, or null if they haven't picked a role yet. */
export async function resolveOAuthUser(): Promise<{ user: User | null; email: string; name: string }> {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) throw new Error('Google sign-in did not return an email')
    const email = authUser.email
    const name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0]

    const { data } = await supabase.from('users').select('id, email, name, role, phone').eq('email', email).maybeSingle()
    if (data) {
        localStorage.setItem('physioflow_user', JSON.stringify(data))
        return { user: data as User, email, name }
    }
    return { user: null, email, name }
}

/** First-time Google user: create their row with the chosen role. */
export async function completeOAuthSignUp(role: 'doctor' | 'patient', extra?: { age?: number | null; injury?: string }) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) throw new Error('No active session')
    const name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email.split('@')[0]
    const user = { id: authUser.id, email: authUser.email, name, role }
    // ponytail: password column is required by the schema; OAuth users get an unusable random value
    const { error } = await supabase.from('users').insert({
        ...user,
        password: crypto.randomUUID(),
        age: extra?.age ?? null,
        injury: extra?.injury || null,
    })
    if (error) throw error
    localStorage.setItem('physioflow_user', JSON.stringify(user))
    return { user }
}
