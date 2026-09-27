import { listQuizzes } from "@/lib/quiz-data";
import { toSummary } from "@/lib/questions";
import { NextResponse } from "next/server";

export async function GET() {
  const quizzes = await listQuizzes();
  return NextResponse.json({ quizzes: quizzes.map(toSummary) });
}
