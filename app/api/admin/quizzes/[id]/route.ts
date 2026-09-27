import { NextResponse } from "next/server";
import { deleteQuiz, getSession } from "@/lib/quiz-data";

/** Admin-only: delete a quiz and its questions (cascades). */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/quizzes/[id]">) {
  const { isAdmin } = await getSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;

  try {
    await deleteQuiz(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete quiz" },
      { status: 500 },
    );
  }
}
