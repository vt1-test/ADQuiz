import { NextResponse } from "next/server";
import { createQuiz, listQuizzes, getSession } from "@/lib/quiz-data";

interface QuizPayload {
  title?: string;
  description?: string;
  category?: string;
  icon?: string;
  difficulty?: "easy" | "medium" | "hard";
  questions?: Array<{
    question?: string;
    options?: string[];
    correctIndex?: number;
    explanation?: string;
  }>;
}

/** Admin-only: create a quiz with its questions. */
export async function POST(request: Request) {
  const { isAdmin } = await getSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: QuizPayload;
  try {
    payload = (await request.json()) as QuizPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const questions = (payload.questions ?? []).filter(
    (q) => q.question?.trim() && Array.isArray(q.options) && q.options.length >= 2,
  );

  if (questions.length === 0) {
    return NextResponse.json({ error: "At least one valid question is required" }, { status: 400 });
  }

  const badOption = questions.find(
    (q) => q.correctIndex === undefined || q.correctIndex < 0 || q.correctIndex >= q.options!.length,
  );
  if (badOption) {
    return NextResponse.json({ error: "Each question needs a valid correctIndex" }, { status: 400 });
  }

  try {
    const quiz = await createQuiz({
      title: payload.title.trim(),
      description: payload.description?.trim() ?? "",
      category: payload.category?.trim() || "General",
      icon: payload.icon?.trim() || "🎯",
      difficulty: payload.difficulty ?? "medium",
      questions: questions.map((q) => ({
        id: crypto.randomUUID(),
        question: q.question!.trim(),
        options: q.options!.map((o) => o.trim()),
        correctIndex: q.correctIndex!,
        explanation: q.explanation?.trim() || undefined,
      })),
    });

    return NextResponse.json({ quiz });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create quiz" },
      { status: 500 },
    );
  }
}

/** Admin-only: list quizzes with their questions (for management). */
export async function GET() {
  const { isAdmin } = await getSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const quizzes = await listQuizzes();
  return NextResponse.json({ quizzes });
}
