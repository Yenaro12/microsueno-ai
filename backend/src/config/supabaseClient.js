import { createClient } from '@supabase/supabase-js'

// Intentamos leer de process.env, si el usuario tiene .env cargado con dotenv o en el script
const supabaseUrl = process.env.SUPABASE_URL || 'https://vmhxbhhdujhpnmjwooqh.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_fRfMiDeDz1HrkxIU0tJvOQ_IuULRQIc'

export const supabase = createClient(supabaseUrl, supabaseKey)
