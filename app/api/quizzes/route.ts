import { getQuizSummaries } from "@/lib/questions";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ quizzes: getQuizSummaries() });
}
