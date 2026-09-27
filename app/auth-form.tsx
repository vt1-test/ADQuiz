"use client";

import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

type Mode = "signin" | "signup";

interface AuthFormProps {
  mode: Mode;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const isSignUp = mode === "signup";

  function handleOAuth() {
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) setError(error.message);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const supabase = createSupabaseBrowserClient();

    startTransition(async () => {
      const result = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      if (isSignUp && result.data.user && !result.data.session) {
        setError("Check your inbox to confirm your email before signing in.");
        return;
      }

      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <button
        onClick={handleOAuth}
        disabled={pending}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50"
      >
        <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="h-px flex-1 bg-white/10" />
        OR
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
            className="w-full rounded-xl border-0 bg-white/[0.05] px-4 py-3 text-white ring-1 ring-white/10 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
            className="w-full rounded-xl border-0 bg-white/[0.05] px-4 py-3 text-white ring-1 ring-white/10 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="At least 6 characters"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ring-1 ring-rose-500/30">{error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
