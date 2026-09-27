import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Google OAuth redirects back here with a `code`. Exchanging it sets the
 * session cookies, then we send the user home.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${url.origin}/signin?error=oauth`);
    }
  }

  return NextResponse.redirect(`${url.origin}${next}`);
}
