export const SUPABASE_CONFIG = {
  url:
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL ||
    'https://vmhxbhhdujhpnmjwooqh.supabase.co',
  publishableKey:
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_fRfMiDeDz1HrkxIU0tJvOQ_IuULRQIc',
}

export const supabaseConfigurado = Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.publishableKey)
