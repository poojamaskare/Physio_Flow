import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://irbccmthfevoxiqhkyvs.supabase.co'
const supabaseKey = 'sb_publishable_SjVGSY0vXgB9PdlqDwCrmg_nHdF9Z7i'

export const supabase = createClient(supabaseUrl, supabaseKey)
