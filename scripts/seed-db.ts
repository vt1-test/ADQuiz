import postgres from "postgres";
import { SEED_QUIZZES } from "@/lib/seed-data";

/**
 * Loads the starter quizzes into Supabase over the Postgres connection. The
 * REST-based seed script (npm run seed) needs the service role key, so this
 * variant seeds via the `postgres` user when only the DB password is at hand.
 *
 *   npx tsx scripts/seed-db.ts
 *
 * Idempotent: existing quizzes are left untouched.
 */
const sql = postgres(process.env.SUPABASE_DB_URL!, { max: 1 });

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const [{ count: existing }] = await sql`select count(*)::int as count from public.quizzes`;
  if (existing > 0) {
    console.log(`ℹ️  ${existing} quizzes already exist — nothing to seed.`);
    return;
  }

  let questionCount = 0;

  for (const quiz of SEED_QUIZZES) {
    const [row] = await sql`
      insert into public.quizzes (slug, title, description, category, icon, difficulty)
      values (${slugify(quiz.title)}, ${quiz.title}, ${quiz.description}, ${quiz.category}, ${quiz.icon}, ${quiz.difficulty})
      returning id
    `;

    if (quiz.questions.length > 0) {
      // Inline the JSON rather than parameterize it: the pooler plans a
      // parameterized jsonb_array_elements as a scalar and fails extraction.
      const json = JSON.stringify(quiz.questions).replace(/'/g, "''");
      await sql.unsafe(`
        insert into public.questions (quiz_id, position, question, options, correct_index, explanation)
        select
          '${row.id}',
          (arr.idx - 1)::int,
          q->>'question',
          q->'options',
          (q->>'correctIndex')::int,
          q->>'explanation'
        from jsonb_array_elements('${json}'::jsonb) with ordinality as arr(q, idx)
      `);
      questionCount += quiz.questions.length;
    }
  }

  console.log(`✅ Seeded ${SEED_QUIZZES.length} quizzes and ${questionCount} questions.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
