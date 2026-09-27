"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import type { QuizClient, GradeResult } from "@/lib/questions";

interface QuizPlayerProps {
  quiz: QuizClient;
}

const LETTERS = ["A", "B", "C", "D", "E"];

type Status = "idle" | "submitting" | "done" | "error";

function getMessage(pct: number): string {
  if (pct === 100) return "Perfect score! Outstanding! 🏆";
  if (pct >= 80) return "Excellent work! 🌟";
  if (pct >= 60) return "Good job! 👍";
  if (pct >= 40) return "Not bad — keep practising. 📚";
  return "Keep learning — try again! 💪";
}

export default function QuizPlayer({ quiz }: QuizPlayerProps) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = quiz.questions.length;
  const question = quiz.questions[current];
  const selected = answers[question.id] ?? null;
  const answeredCount = Object.keys(answers).length;
  const isLast = current === total - 1;
  const progress = Math.round(((current + 1) / total) * 100);

  const pick = useCallback(
    (option: string) => {
      if (status === "submitting" || status === "done") return;
      setAnswers((prev) => ({ ...prev, [question.id]: option }));
    },
    [question.id, status],
  );

  const goNext = useCallback(() => {
    setCurrent((idx) => Math.min(idx + 1, total - 1));
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrent((idx) => Math.max(idx - 1, 0));
  }, []);

  const submit = useCallback(async () => {
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Request failed with status ${res.status}`);
      }
      const data = (await res.json()) as { result: GradeResult };
      setResult(data.result);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }, [answers, quiz.id]);

  const restart = useCallback(() => {
    setAnswers({});
    setCurrent(0);
    setResult(null);
    setError(null);
    setStatus("idle");
  }, []);

  const reviewItems = useMemo(() => {
    if (!result) return [];
    return result.breakdown.map((item) => ({
      ...item,
      selected: item.selected ?? answers[item.questionId] ?? null,
    }));
  }, [result, answers]);

  if (status === "done" && result) {
    return (
      <div className="animate-pop-in space-y-8">
        <div className="rounded-2xl bg-white/[0.04] p-8 text-center ring-1 ring-white/10">
          <p className="text-sm font-medium uppercase tracking-widest text-slate-400">Your score</p>
          <p className="mt-3 text-6xl font-extrabold text-white">
            {result.score}
            <span className="text-2xl font-bold text-slate-500">/{result.total}</span>
          </p>
          <div className="mx-auto mt-6 h-2.5 w-full max-w-sm overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
              style={{ width: `${result.percentage}%` }}
            />
          </div>
          <p className="mt-5 text-lg font-semibold text-slate-200">{getMessage(result.percentage)}</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Review</h2>
          {reviewItems.map((item, idx) => (
            <div
              key={item.questionId}
              className={`rounded-xl p-5 ring-1 ${
                item.isCorrect ? "bg-emerald-500/[0.07] ring-emerald-500/25" : "bg-rose-500/[0.07] ring-rose-500/25"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={item.isCorrect ? "text-emerald-400" : "text-rose-400"} aria-hidden="true">
                  {item.isCorrect ? "✓" : "✗"}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-white">
                    {idx + 1}. {item.question}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    <span className="text-slate-500">Your answer:</span>{" "}
                    <span className={item.isCorrect ? "text-emerald-300" : "text-rose-300"}>
                      {item.selected || "No answer"}
                    </span>
                  </p>
                  {!item.isCorrect && (
                    <p className="mt-1 text-sm text-slate-400">
                      <span className="text-slate-500">Correct answer:</span>{" "}
                      <span className="font-medium text-emerald-300">{item.correct}</span>
                    </p>
                  )}
                  {item.explanation && (
                    <p className="mt-3 border-t border-white/5 pt-3 text-sm text-slate-400">{item.explanation}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={restart}
            className="rounded-xl bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/15"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl bg-indigo-500 px-6 py-3 text-center font-semibold text-white transition hover:bg-indigo-400"
          >
            Browse quizzes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="animate-pop-in rounded-xl bg-rose-500/10 p-4 text-sm text-rose-300 ring-1 ring-rose-500/30">
          {error}
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between text-sm text-slate-400">
          <span>
            Question {current + 1} of {total}
          </span>
          <span>{answeredCount} answered</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div key={question.id} className="animate-pop-in">
        <h2 className="text-2xl font-bold leading-snug text-white">{question.question}</h2>
        <div className="mt-6 grid gap-3" role="radiogroup" aria-label="Answer options">
          {question.options.map((option, idx) => {
            const isPicked = selected === option;
            return (
              <button
                key={option}
                role="radio"
                aria-checked={isPicked}
                onClick={() => pick(option)}
                disabled={status === "submitting"}
                className={`flex items-center gap-4 rounded-xl p-4 text-left ring-1 transition-all ${
                  isPicked
                    ? "bg-indigo-500/15 ring-indigo-500/50"
                    : "bg-white/[0.03] ring-white/10 hover:bg-white/[0.07] hover:ring-white/20"
                }`}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    isPicked ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-300"
                  }`}
                  aria-hidden="true"
                >
                  {LETTERS[idx]}
                </span>
                <span className="font-medium text-slate-100">{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          onClick={goPrev}
          disabled={current === 0 || status === "submitting"}
          className="rounded-xl px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Previous
        </button>
        {isLast ? (
          <button
            onClick={submit}
            disabled={status === "submitting" || answeredCount === 0}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-7 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "submitting" ? "Submitting…" : "Submit answers"}
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={status === "submitting"}
            className="rounded-xl bg-white/10 px-7 py-3 font-semibold text-white transition hover:bg-white/15"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
