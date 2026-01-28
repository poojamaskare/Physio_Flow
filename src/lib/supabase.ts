import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://irbccmthfevoxiqhkyvs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyYmNjbXRoZmV2b3hpcWhreXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMDI3NzEsImV4cCI6MjA4NDc3ODc3MX0.83Ldlmd-cK6GSBTvNE7ignyrrbbqh3ooPPeX2NMclrc'

export const supabase = createClient(supabaseUrl, supabaseKey)
