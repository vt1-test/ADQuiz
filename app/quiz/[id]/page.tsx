import { notFound } from "next/navigation";
import Link from "next/link";
import { getQuiz } from "@/lib/quiz-data";
import { toClientQuiz } from "@/lib/questions";
import QuizPlayer from "./quiz-player";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await getQuiz(id);

  if (!quiz) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
      <div className="mb-8">
        <Link href="/" className="text-sm font-medium text-slate-400 transition hover:text-slate-200">
          ← All quizzes
        </Link>
      </div>

      <header className="mb-10 flex items-center gap-4">
        <span className="-mt-3 text-4xl" aria-hidden="true">
          {quiz.icon}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
          <p className="text-sm text-slate-400">
            {quiz.category} · {quiz.questions.length} questions
          </p>
        </div>
      </header>

      <QuizPlayer quiz={toClientQuiz(quiz)} />
    </main>
  );
}
