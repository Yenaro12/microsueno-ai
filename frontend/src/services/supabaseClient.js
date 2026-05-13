import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG, supabaseConfigurado } from '../config/supabaseConfig'

export const supabase = supabaseConfigurado
  ? createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null

export const estaSupabaseDisponible = () => Boolean(supabase)
