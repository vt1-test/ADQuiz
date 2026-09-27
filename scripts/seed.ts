import { SEED_QUIZZES } from "@/lib/seed-data";
import { seedDatabase } from "@/lib/quiz-data";

/**
 * Loads the starter quizzes into Supabase. Run once after creating the project:
 *
 *   npx tsx scripts/seed.ts
 *
 * Idempotent: if quizzes already exist it exits without inserting anything.
 */
seedDatabase()
  .then(({ quizzes, questions }) => {
    if (quizzes === 0) {
      console.log("ℹ️  Quizzes already exist — nothing to seed.");
    } else {
      console.log(`✅ Seeded ${quizzes} quizzes and ${questions} questions.`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
