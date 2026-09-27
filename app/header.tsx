import Link from "next/link";
import { getSession } from "@/lib/quiz-data";

const linkClass = "text-sm font-medium text-slate-300 transition hover:text-white";

export default async function Header() {
  const { user, isAdmin } = await getSession();

  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-white">
          <span aria-hidden="true">🎯</span>
          Quiz Quest
        </Link>

        <nav className="flex items-center gap-5">
          <Link href="/" className={linkClass}>
            Quizzes
          </Link>
          {isAdmin && (
            <Link href="/admin" className={linkClass}>
              Admin
            </Link>
          )}
          {user ? (
            <span className="text-sm text-slate-400">{user.email}</span>
          ) : (
            <Link href="/signin" className={linkClass}>
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
