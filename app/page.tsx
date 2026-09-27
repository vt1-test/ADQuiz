import Link from "next/link";
import { getQuizSummaries, type QuizSummary } from "@/lib/questions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz Quest — Test Your Knowledge",
  description: "Pick a trivia quiz, answer the questions, and get instant scoring with explanations.",
};

const difficultyStyles: Record<QuizSummary["difficulty"], string> = {
  easy: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  hard: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

export default function Home() {
  const quizzes = getQuizSummaries();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8">
      <header className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm font-medium text-slate-300 ring-1 ring-white/10">
          🎯 Trivia Challenge
        </span>
        <h1 className="mt-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">
          Quiz Quest
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-slate-400">
          Test your knowledge across trivia, science, technology, and geography. Pick a quiz below to begin.
        </p>
      </header>

      <section className="mt-14 grid gap-6 sm:grid-cols-2">
        {quizzes.map((quiz) => (
          <Link
            key={quiz.id}
            href={`/quiz/${quiz.id}`}
            className="group relative flex flex-col rounded-2xl bg-white/[0.04] p-7 ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-1 hover:bg-white/[0.07] hover:ring-white/20"
          >
            <div className="flex items-center justify-between">
              <span className="text-4xl" aria-hidden="true">
                {quiz.icon}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${difficultyStyles[quiz.difficulty]}`}
              >
                {quiz.difficulty}
              </span>
            </div>
            <h2 className="mt-5 text-xl font-bold text-white">{quiz.title}</h2>
            <p className="mt-2 flex-1 text-sm text-slate-400">{quiz.description}</p>
            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-5">
              <span className="text-sm font-medium text-slate-300">
                {quiz.questionCount} questions · {quiz.category}
              </span>
              <span className="text-sm font-semibold text-indigo-400 transition-transform group-hover:translate-x-1">
                Start →
              </span>
            </div>
          </Link>
        ))}
      </section>

      <footer className="mt-20 text-center text-sm text-slate-600">
        Built with Next.js · Deploy free on Vercel
      </footer>
    </main>
  );
}
