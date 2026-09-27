import { createBrowserClient } from "@supabase/ssr";

/** Browser client. Only carries the anon public key — RLS applies. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
