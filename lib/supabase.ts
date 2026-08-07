import { createClient } from "@supabase/supabase-js";

// Server-only client. Every /api/v1 route runs on the server and talks to
// Postgres with the secret key — there is no client-side Supabase usage
// and no RLS policies to satisfy.
export function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
