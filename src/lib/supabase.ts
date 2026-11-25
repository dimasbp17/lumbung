import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
// Supabase now uses a "publishable key" (sb_publishable_...).
// The legacy anon key (JWT) is still supported as a fallback.
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

/** false when .env is not filled in — the app then shows setup instructions. */
export const isSupabaseConfigured = Boolean(url && key)

export const supabase = createClient(
  url ?? "http://localhost:54321",
  key ?? "not-configured",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)
