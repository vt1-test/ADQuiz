import { listAttempts, getSession } from "@/lib/quiz-data";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Admin — Quiz Quest",
  description: "Participant results and quiz management.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminPage() {
  const { user, isAdmin } = await getSession();

  if (!user) {
    redirect("/signin?next=/admin");
  }
  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-20 text-center">
        <span className="text-4xl" aria-hidden="true">
          🔒
        </span>
        <h1 className="mt-4 text-2xl font-bold text-white">Admins only</h1>
        <p className="mt-3 text-slate-400">
          Your account ({user.email}) isn&rsquo;t on the admin allowlist. Add it to the <code>ADMIN_EMAILS</code>{" "}
          environment variable to get access.
        </p>
        <Link href="/" className="mt-8 inline-block rounded-xl bg-white/10 px-6 py-3 font-semibold text-white hover:bg-white/15">
          Back home
        </Link>
      </main>
    );
  }

  const attempts = await listAttempts();

  const totalParticipants = new Set(attempts.map((a) => a.userId)).size;
  const avgScore =
    attempts.length === 0 ? 0 : Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin dashboard</h1>
          <p className="mt-1 text-slate-400">Signed in as {user.email}</p>
        </div>
        <Link
          href="/admin/quizzes"
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-center font-semibold text-white transition hover:brightness-110"
        >
          Manage quizzes →
        </Link>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10">
          <p className="text-sm text-slate-400">Participants</p>
          <p className="mt-2 text-3xl font-bold text-white">{totalParticipants}</p>
        </div>
        <div className="rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10">
          <p className="text-sm text-slate-400">Attempts</p>
          <p className="mt-2 text-3xl font-bold text-white">{attempts.length}</p>
        </div>
        <div className="rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10">
          <p className="text-sm text-slate-400">Average score</p>
          <p className="mt-2 text-3xl font-bold text-white">{avgScore}%</p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-white">All results</h2>

        {attempts.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-white/[0.04] p-10 text-center ring-1 ring-white/10">
            <p className="text-slate-300">No results yet.</p>
            <p className="mt-2 text-sm text-slate-500">They will appear here once participants submit quizzes.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-white/10 text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Participant</th>
                  <th className="px-5 py-3 font-medium">Quiz</th>
                  <th className="px-5 py-3 font-medium">Score</th>
                  <th className="px-5 py-3 font-medium">Percentage</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="text-slate-200">
                    <td className="px-5 py-3.5">{attempt.email}</td>
                    <td className="px-5 py-3.5">{attempt.quizTitle}</td>
                    <td className="px-5 py-3.5 tabular-nums">
                      {attempt.score}/{attempt.total}
                    </td>
                    <td className="px-5 py-3.5 tabular-nums">{attempt.percentage}%</td>
                    <td className="px-5 py-3.5 text-slate-400">{formatDate(attempt.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
