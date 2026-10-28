import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns a Supabase client only when both public env vars are set.
 * Returns null in Demo Mode (no keys configured) and the app must not crash.
 * The service-role key is never used in browser code.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey);
  } catch {
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
