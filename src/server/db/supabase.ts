import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const isSupabaseConfigured = Boolean(
  supabaseUrl && (supabaseServiceKey || supabaseAnonKey)
)

const fallbackUrl = "https://placeholder.supabase.co"
const fallbackKey = "placeholder-key-not-configured"

/**
 * Server-side Supabase client with service_role key.
 * Gracefully initializes even when environment variables are absent in frontend dev mode.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl || fallbackUrl,
  supabaseServiceKey || fallbackKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

/**
 * Public Supabase client with anon key.
 */
export const supabasePublic: SupabaseClient = createClient(
  supabaseUrl || fallbackUrl,
  supabaseAnonKey || fallbackKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)
