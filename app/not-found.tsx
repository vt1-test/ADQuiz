import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-5 text-center">
      <span className="text-5xl" aria-hidden="true">
        🤔
      </span>
      <h1 className="mt-6 text-3xl font-bold text-white">Quiz not found</h1>
      <p className="mt-3 text-slate-400">That quiz doesn&rsquo;t exist or may have been removed.</p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white transition hover:bg-indigo-400"
      >
        Browse all quizzes
      </Link>
    </main>
  );
}
