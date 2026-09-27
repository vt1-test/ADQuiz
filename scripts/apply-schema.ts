import postgres from "postgres";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Applies supabase/schema.sql directly to the project database. The anon REST
 * key can't create tables, so we connect as the `postgres` user.
 *
 *   npx tsx scripts/apply-schema.ts
 *
 * Splitting on ";" is crude but fine here — the SQL has no triggers/procedures
 * containing semicolons inside string literals.
 */
const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error(
    "❌ Missing SUPABASE_DB_URL (postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres)",
  );
  process.exit(1);
}

const sql = postgres(dbUrl, {
  max: 1,
  // The pooler is SNI-routed; the project ref has to travel as the username.
  connection: { application_name: "quiz-quest-schema" },
});

async function main() {
  const schemaPath = resolve(process.cwd(), "supabase/schema.sql");
  const schema = readFileSync(schemaPath, "utf8");

  // Split into statements while respecting $$...$$ blocks, so trigger bodies
  // containing semicolons don't get truncated.
  const statements = splitStatements(schema);

  for (const statement of statements) {
    await sql.unsafe(statement);
  }

  const [tables] = await sql`
    select count(*)::int as count
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('quizzes', 'questions', 'attempts', 'profiles')
  `;

  console.log(`✅ Schema applied. Public tables present: ${tables.count} of 4`);
}

function splitStatements(sqlText: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inDollar = false;
  let i = 0;

  while (i < sqlText.length) {
    if (sqlText.startsWith("$$", i)) {
      inDollar = !inDollar;
      current += "$$";
      i += 2;
      continue;
    }

    const char = sqlText[i];
    if (char === ";" && !inDollar) {
      const trimmed = current.trim();
      if (trimmed.length > 0 && !trimmed.startsWith("--")) statements.push(trimmed);
      current = "";
      i++;
      continue;
    }

    if (char === "-" && sqlText[i + 1] === "-") {
      const newline = sqlText.indexOf("\n", i);
      i = newline === -1 ? sqlText.length : newline;
      continue;
    }

    current += char;
    i++;
  }

  const tail = current.trim();
  if (tail.length > 0 && !tail.startsWith("--")) statements.push(tail);

  return statements;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
