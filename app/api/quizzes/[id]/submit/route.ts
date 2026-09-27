import { getQuiz, gradeQuiz } from "@/lib/questions";
import { NextResponse } from "next/server";

interface SubmitBody {
  answers?: Record<string, string>;
}

export async function POST(request: Request, ctx: RouteContext<"/api/quizzes/[id]/submit">) {
  const { id } = await ctx.params;
  const quiz = getQuiz(id);

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

  return NextResponse.json({ result: gradeQuiz(quiz, body.answers) });
}
