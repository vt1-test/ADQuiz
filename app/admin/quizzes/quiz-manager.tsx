"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Quiz } from "@/lib/questions";

interface QuizManagerProps {
  quizzes: Quiz[];
}

type QuestionDraft = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

function emptyQuestion(): QuestionDraft {
  return { question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" };
}

export default function QuizManager({ quizzes: initialQuizzes }: QuizManagerProps) {
  const [quizzes, setQuizzes] = useState(initialQuizzes);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [difficulty, setDifficulty] = useState<Quiz["difficulty"]>("medium");
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function updateQuestion(idx: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }

  function updateOption(qIdx: number, oIdx: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? value : o)) } : q)),
    );
  }

  async function createQuiz(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const cleanQuestions = questions
      .map((q) => ({
        ...q,
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()),
        explanation: q.explanation.trim(),
      }))
      .filter((q) => q.question && q.options.every((o) => o.length > 0));

    if (!title.trim()) {
      setError("A quiz title is required.");
      return;
    }
    if (cleanQuestions.length === 0) {
      setError("Add at least one complete question (text plus all four options).");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category: category.trim() || "General",
          icon: icon.trim() || "🎯",
          difficulty,
          questions: cleanQuestions,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Failed to create quiz");
        return;
      }

      const data = (await res.json()) as { quiz: Quiz };
      setQuizzes((prev) => [...prev, data.quiz]);
      setTitle("");
      setDescription("");
      setCategory("");
      setIcon("🎯");
      setDifficulty("medium");
      setQuestions([emptyQuestion()]);
      setShowForm(false);
      router.refresh();
    });
  }

  async function deleteQuiz(quiz: Quiz) {
    if (!window.confirm(`Delete "${quiz.title}" and its ${quiz.questions.length} questions? This cannot be undone.`)) {
      return;
    }
    setBusyId(quiz.id);
    setError(null);

    const res = await fetch(`/api/admin/quizzes/${encodeURIComponent(quiz.id)}`, { method: "DELETE" });
    setBusyId(null);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Failed to delete quiz");
      return;
    }

    setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-300 ring-1 ring-rose-500/30">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-slate-400">{quizzes.length} quiz{quizzes.length === 1 ? "" : "zes"}</p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-white/10 px-5 py-2.5 font-semibold text-white transition hover:bg-white/15"
        >
          {showForm ? "Cancel" : "+ New quiz"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createQuiz} className="animate-pop-in space-y-6 rounded-2xl bg-white/[0.04] p-7 ring-1 ring-white/10">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-300">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-xl bg-white/[0.05] px-4 py-2.5 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="My new quiz"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-300">Category</span>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl bg-white/[0.05] px-4 py-2.5 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="General"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-300">Icon (emoji)</span>
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full rounded-xl bg-white/[0.05] px-4 py-2.5 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="🎯"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-300">Difficulty</span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Quiz["difficulty"])}
                className="w-full rounded-xl bg-white/[0.05] px-4 py-2.5 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Description</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-white/[0.05] px-4 py-2.5 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="A short description shown on the quiz card"
            />
          </label>

          <div className="space-y-6 border-t border-white/5 pt-6">
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="space-y-3 rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-300">Question {qIdx + 1}</span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qIdx))}
                      className="text-xs font-medium text-rose-400 hover:text-rose-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  value={q.question}
                  onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                  placeholder="Question text"
                  className="w-full rounded-lg bg-white/[0.05] px-3 py-2 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  {q.options.map((option, oIdx) => (
                    <label key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIdx}`}
                        checked={q.correctIndex === oIdx}
                        onChange={() => updateQuestion(qIdx, { correctIndex: oIdx })}
                        className="size-4 accent-indigo-500"
                        title="Mark as correct"
                      />
                      <input
                        value={option}
                        onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                        placeholder={`Option ${oIdx + 1}`}
                        className="w-full rounded-lg bg-white/[0.05] px-3 py-2 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </label>
                  ))}
                </div>
                <input
                  value={q.explanation}
                  onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                  placeholder="Explanation (shown in results review)"
                  className="w-full rounded-lg bg-white/[0.05] px-3 py-2 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
              className="w-full rounded-xl border border-dashed border-white/15 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.04]"
            >
              + Add another question
            </button>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 font-semibold text-white transition hover:brightness-110"
          >
            Create quiz
          </button>
        </form>
      )}

      <div className="space-y-3">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10"
          >
            <div className="flex min-w-0 items-center gap-4">
              <span className="text-2xl" aria-hidden="true">
                {quiz.icon}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{quiz.title}</p>
                <p className="text-sm text-slate-400">
                  {quiz.questions.length} questions · {quiz.category} · {quiz.difficulty}
                </p>
              </div>
            </div>
            <button
              onClick={() => deleteQuiz(quiz)}
              disabled={busyId === quiz.id}
              className="shrink-0 rounded-lg bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 ring-1 ring-rose-500/30 transition hover:bg-rose-500/20 disabled:opacity-50"
            >
              {busyId === quiz.id ? "Deleting…" : "Delete"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
