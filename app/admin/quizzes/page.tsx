import { listQuizzes, getSession } from "@/lib/quiz-data";
import { redirect } from "next/navigation";
import Link from "next/link";
import QuizManager from "./quiz-manager";

export const metadata = {
  title: "Manage quizzes — Quiz Quest Admin",
  description: "Create and delete quizzes and questions.",
};

export default async function ManageQuizzesPage() {
  const { user, isAdmin } = await getSession();

  if (!user) {
    redirect("/signin?next=/admin/quizzes");
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

  const quizzes = await listQuizzes();

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
      <div className="mb-8">
        <Link href="/admin" className="text-sm font-medium text-slate-400 transition hover:text-slate-200">
          ← Admin dashboard
        </Link>
      </div>

      <header className="mb-10">
        <h1 className="text-3xl font-bold text-white">Manage quizzes</h1>
        <p className="mt-2 text-slate-400">Create new quizzes or delete existing ones.</p>
      </header>

      <QuizManager quizzes={quizzes} />
    </main>
  );
}
