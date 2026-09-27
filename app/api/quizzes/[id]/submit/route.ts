import { getQuiz, saveAttempt, getSessionUser } from "@/lib/quiz-data";
import { gradeQuiz } from "@/lib/questions";
import { NextResponse } from "next/server";

interface SubmitBody {
  answers?: Record<string, string>;
  timeMs?: number;
}

/**
 * Grades a submission and stores the result against the signed-in user.
 * Requires authentication — anonymous submissions are rejected.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/quizzes/[id]/submit">) {
  const { id } = await ctx.params;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to submit a quiz." }, { status: 401 });
  }

  const quiz = await getQuiz(id);
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.answers !== "object" || body.answers === null) {
    return NextResponse.json({ error: "Missing 'answers' object" }, { status: 400 });
  }

  const result = gradeQuiz(quiz, body.answers);

  await saveAttempt({
    userId: user.id,
    quizId: id,
    score: result.score,
    total: result.total,
    percentage: result.percentage,
    timeMs: typeof body.timeMs === "number" ? body.timeMs : undefined,
  });

  return NextResponse.json({ result });
}
