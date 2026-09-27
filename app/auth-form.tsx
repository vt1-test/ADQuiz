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
