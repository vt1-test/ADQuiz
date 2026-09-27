import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Client bound to the request cookies — use for auth state and RLS-scoped reads. */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, anonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component where cookies are read-only. Safe to ignore —
          // the proxy refreshes the session before the request reaches the app.
        }
      },
    },
  });
}

/** Service-role client that bypasses RLS. Server only — never expose to the browser. */
export function createSupabaseServiceClient() {
  return createClient(supabaseUrl!, serviceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Clear, early failure when the project isn't configured yet. */
export function assertSupabaseConfigured() {
  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and fill in your project URL, anon key, and service role key.",
    );
  }
}
