import { getQuiz, toClientQuiz } from "@/lib/questions";
import { NextResponse } from "next/server";

export async function GET(_request: Request, ctx: RouteContext<"/api/quizzes/[id]">) {
  const { id } = await ctx.params;
  const quiz = getQuiz(id);

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  return NextResponse.json({ quiz: toClientQuiz(quiz) });
}
