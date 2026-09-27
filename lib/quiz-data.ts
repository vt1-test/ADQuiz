import "server-only";

import { createSupabaseServiceClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { SEED_QUIZZES } from "@/lib/seed-data";
import type { Quiz, Question } from "@/lib/questions";

/** Row shapes coming back from Postgres. */
interface QuizRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  icon: string | null;
  difficulty: string;
}

interface QuestionRow {
  id: string;
  quiz_id: string;
  position: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
}

interface AttemptRow {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total: number;
  percentage: number;
  time_ms?: number | null;
  created_at: string;
  profiles?: Array<{ email: string | null; display_name: string | null }> | null;
  quizzes?: Array<{ title: string | null }> | null;
}

function rowToQuiz(row: QuizRow, questions: Question[]): Quiz {
  return {
    id: row.slug,
    title: row.title,
    description: row.description ?? "",
    category: row.category ?? "General",
    icon: row.icon ?? "🎯",
    difficulty: row.difficulty as Quiz["difficulty"],
    questions,
  };
}

function rowToQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    question: row.question,
    options: row.options,
    correctIndex: row.correct_index,
    explanation: row.explanation ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listQuizzes(): Promise<Quiz[]> {
  const supabase = createSupabaseServiceClient();
  const { data: quizzes, error } = await supabase
    .from("quizzes")
    .select("id, slug, title, description, category, icon, difficulty")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load quizzes: ${error.message}`);
  if (!quizzes) return [];

  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("id, quiz_id, position, question, options, correct_index, explanation")
    .order("position", { ascending: true });

  if (qErr) throw new Error(`Failed to load questions: ${qErr.message}`);

  return quizzes.map((quiz) =>
    rowToQuiz(quiz, (questions ?? []).filter((q) => q.quiz_id === quiz.id).map(rowToQuestion)),
  );
}

export async function getQuiz(slug: string): Promise<Quiz | null> {
  const supabase = createSupabaseServiceClient();
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("id, slug, title, description, category, icon, difficulty")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Failed to load quiz: ${error.message}`);
  if (!quiz) return null;

  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("id, quiz_id, position, question, options, correct_index, explanation")
    .eq("quiz_id", quiz.id)
    .order("position", { ascending: true });

  if (qErr) throw new Error(`Failed to load questions: ${qErr.message}`);

  return rowToQuiz(quiz, (questions ?? []).map(rowToQuestion));
}

// ---------------------------------------------------------------------------
// Writes (admin only — callers must verify first)
// ---------------------------------------------------------------------------

export interface QuizInput {
  title: string;
  description: string;
  category: string;
  icon: string;
  difficulty: Quiz["difficulty"];
  questions: Array<Omit<Question, "id">>;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createQuiz(input: QuizInput): Promise<Quiz> {
  const supabase = createSupabaseServiceClient();
  const slug = slugify(input.title);

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .insert({
      slug,
      title: input.title,
      description: input.description,
      category: input.category,
      icon: input.icon || "🎯",
      difficulty: input.difficulty,
    })
    .select("id, slug, title, description, category, icon, difficulty")
    .single();

  if (error) throw new Error(`Failed to create quiz: ${error.message}`);

  const rows = input.questions.map((q, position) => ({
    quiz_id: quiz.id,
    position,
    question: q.question,
    options: q.options,
    correct_index: q.correctIndex,
    explanation: q.explanation ?? null,
  }));

  if (rows.length > 0) {
    const { error: qErr } = await supabase.from("questions").insert(rows);
    if (qErr) throw new Error(`Quiz created but questions failed: ${qErr.message}`);
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, quiz_id, position, question, options, correct_index, explanation")
    .eq("quiz_id", quiz.id)
    .order("position", { ascending: true });

  return rowToQuiz(quiz, (questions ?? []).map(rowToQuestion));
}

export async function deleteQuiz(slug: string): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("quizzes").delete().eq("slug", slug);
  if (error) throw new Error(`Failed to delete quiz: ${error.message}`);
}

export async function deleteQuestion(quizSlug: string, questionId: string): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const { data: quiz } = await supabase.from("quizzes").select("id").eq("slug", quizSlug).maybeSingle();
  if (!quiz) throw new Error("Quiz not found");

  const { error } = await supabase.from("questions").delete().eq("id", questionId).eq("quiz_id", quiz.id);
  if (error) throw new Error(`Failed to delete question: ${error.message}`);
}

export async function addQuestion(quizSlug: string, question: Omit<Question, "id">): Promise<Question> {
  const supabase = createSupabaseServiceClient();

  const { data: quiz } = await supabase.from("quizzes").select("id").eq("slug", quizSlug).maybeSingle();
  if (!quiz) throw new Error("Quiz not found");

  const { data, error } = await supabase
    .from("questions")
    .insert({
      quiz_id: quiz.id,
      position: 9999,
      question: question.question,
      options: question.options,
      correct_index: question.correctIndex,
      explanation: question.explanation ?? null,
    })
    .select("id, quiz_id, position, question, options, correct_index, explanation")
    .single();

  if (error) throw new Error(`Failed to add question: ${error.message}`);

  return rowToQuestion(data);
}

// ---------------------------------------------------------------------------
// Attempts (participant results)
// ---------------------------------------------------------------------------

export interface Attempt {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  quizTitle: string;
  quizId: string;
  score: number;
  total: number;
  percentage: number;
  createdAt: string;
}

export async function saveAttempt(params: {
  userId: string;
  quizId: string;
  score: number;
  total: number;
  percentage: number;
  timeMs?: number;
}): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("attempts").insert({
    user_id: params.userId,
    quiz_id: params.quizId,
    score: params.score,
    total: params.total,
    percentage: params.percentage,
    time_ms: params.timeMs ?? null,
  });

  if (error) throw new Error(`Failed to save attempt: ${error.message}`);
}

function rowToAttempt(row: AttemptRow): Attempt {
  const profile = row.profiles?.[0] ?? null;
  const quiz = row.quizzes?.[0] ?? null;

  return {
    id: row.id,
    userId: row.user_id,
    email: profile?.email ?? "unknown",
    displayName: profile?.display_name ?? "unknown",
    quizTitle: quiz?.title ?? "Unknown quiz",
    quizId: row.quiz_id,
    score: row.score,
    total: row.total,
    percentage: row.percentage,
    createdAt: row.created_at,
  };
}

/** All attempts, newest first, with the player and quiz joined in. */
export async function listAttempts(): Promise<Attempt[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("attempts")
    .select(
      "id, user_id, quiz_id, score, total, percentage, created_at, profiles(email, display_name), quizzes(title)",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(`Failed to load attempts: ${error.message}`);

  return (data ?? []).map(rowToAttempt);
}

/** One participant's attempts (for the signed-in user's own history). */
export async function listAttemptsForUser(userId: string): Promise<Attempt[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("attempts")
    .select(
      "id, user_id, quiz_id, score, total, percentage, created_at, profiles(email, display_name), quizzes(title)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load attempts: ${error.message}`);

  return (data ?? []).map(rowToAttempt);
}

// ---------------------------------------------------------------------------
// Admin helpers
// ---------------------------------------------------------------------------

/** ADMIN_EMAILS env var holds a comma-separated allowlist of admin addresses. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

/** Current session user, or null. */
export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** The session user with an admin flag attached. */
export async function getSession() {
  const user = await getSessionUser();
  return { user, isAdmin: isAdminEmail(user?.email) };
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

export async function seedDatabase(): Promise<{ quizzes: number; questions: number }> {
  const supabase = createSupabaseServiceClient();

  const { data: existing } = await supabase.from("quizzes").select("slug", { count: "exact" });
  if ((existing ?? []).length > 0) {
    return { quizzes: 0, questions: 0 };
  }

  let questions = 0;
  for (const quiz of SEED_QUIZZES) {
    await createQuiz(quiz);
    questions += quiz.questions.length;
  }

  return { quizzes: SEED_QUIZZES.length, questions };
}
