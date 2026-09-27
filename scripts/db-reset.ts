import postgres from "postgres";

/**
 * Wipes the seed tables so the seeder can run clean after a partial attempt.
 *   npx tsx scripts/db-reset.ts
 */
const sql = postgres(process.env.SUPABASE_DB_URL!, { max: 1 });

(async () => {
  await sql`delete from public.attempts`;
  await sql`delete from public.questions`;
  await sql`delete from public.quizzes`;

  const [{ quizzes }] = await sql`select count(*)::int as quizzes from public.quizzes`;
  const [{ questions }] = await sql`select count(*)::int as questions from public.questions`;

  console.log(`🧹 Wiped seed data. Now: ${quizzes} quizzes, ${questions} questions.`);
  await sql.end();
})();
