# Quiz Quest 🎯

A full-stack trivia quiz app built with **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Supabase**. Deployable on the Vercel free tier.

## Features

**For participants**
- Browse the quiz catalog (category, difficulty, question count)
- One-question-at-a-time player with progress bar and free navigation
- Instant scoring with a per-question review and explanations
- Sign in / sign up with **Google** or **email + password**
- Results are saved to your account

**For admins**
- Dashboard of all participant results (email, quiz, score, percentage, date)
- Summary stats: participant count, total attempts, average score
- Create quizzes with any number of questions (mark the correct answer per question)
- Delete quizzes (and their questions) at any time

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.3.6 (App Router, Turbopack) |
| UI | React 19.2, Tailwind CSS v4 |
| Language | TypeScript 5 |
| Database + Auth | Supabase (Postgres, email/password, Google OAuth) |
| API | Route Handlers (`app/api/.../route.ts`) |

## Setup

### 1. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) (free tier: 500MB database, 50,000 monthly users)
2. Create a new project and wait for it to provision
3. Go to **Settings → API** and note:
   - `Project URL`
   - `anon` public key
   - `service_role` secret (keep this server-side only)

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAILS=you@example.com
```

`ADMIN_EMAILS` is a comma-separated allowlist controlling who can open the admin dashboard. Only these accounts see the Admin link and can create/delete quizzes.

### 3. Create the database schema

Open the Supabase **SQL Editor**, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates the `quizzes`, `questions`, `attempts`, and `profiles` tables, enables Row Level Security, and sets up the trigger that creates a profile row whenever a user signs up.

### 4. Enable Google sign-in

1. In Supabase, go to **Authentication → Providers → Google** and enable it
2. Follow the instructions to create a Google Cloud OAuth credential (Supabase shows the exact redirect URL to allow)
3. Add the same redirect URL to your Google Cloud Console authorization list

Email + password works out of the box with no extra setup.

### 5. Install and seed

```bash
npm install
npm run seed   # loads the four starter quizzes into Supabase
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build & run (production)

```bash
npm run build
npm run start
```

## How admin access works

There is no admin role in the database. The `ADMIN_EMAILS` environment variable is an allowlist, checked on every request:

```ts
export function isAdminEmail(email: string | null | undefined): boolean {
  // splits ADMIN_EMAILS on commas and compares case-insensitively
}
```

To grant or revoke admin access, change the env var and redeploy. On Vercel: **Settings → Environment Variables**.

## Project structure

```
app/
├─ admin/
│  ├─ page.tsx                       # Admin dashboard (all results)
│  └─ quizzes/
│     ├─ page.tsx                    # Quiz management
│     └─ quiz-manager.tsx            # Client: create/delete quizzes
├─ api/
│  ├─ admin/quizzes/
│  │  ├─ route.ts                    # POST/GET quizzes (admin only)
│  │  └─ [id]/route.ts               # DELETE quiz (admin only)
│  └─ quizzes/
│     ├─ route.ts                    # GET quiz summaries
│     ├─ [id]/route.ts               # GET quiz (answers stripped)
│     └─ [id]/submit/route.ts        # POST → grade + save attempt
├─ auth/callback/route.ts            # Google OAuth callback
├─ quiz/[id]/
│  ├─ page.tsx                       # Server component: loads quiz
│  └─ quiz-player.tsx                # Client: interactive quiz flow
├─ signin/page.tsx                   # Sign in
├─ signup/page.tsx                    # Sign up
├─ auth-form.tsx                     # Google + email/password form
├─ header.tsx                        # Auth-aware navigation
├─ page.tsx                          # Home: quiz catalog
├─ layout.tsx
├─ not-found.tsx
└─ globals.css
lib/
├─ questions.ts                      # Types + grading logic
├─ quiz-data.ts                      # Supabase data layer (reads/writes)
├─ seed-data.ts                      # The four starter quizzes
└─ supabase/
   ├─ server.ts                      # Server + service clients
   └─ browser.ts                     # Browser client
supabase/
└─ schema.sql                        # Tables, RLS, profile trigger
scripts/
└─ seed.ts                           # Loads starter quizzes
proxy.ts                              # Session refresh (Next 16 name for middleware)
```

## API reference

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/quizzes` | Public | List all quiz summaries |
| `GET` | `/api/quizzes/[id]` | Public | Get one quiz — correct answers stripped |
| `POST` | `/api/quizzes/[id]/submit` | Required | Grade answers, save the attempt, return score |
| `GET` | `/api/admin/quizzes` | Admin | List quizzes with questions |
| `POST` | `/api/admin/quizzes` | Admin | Create a quiz with questions |
| `DELETE` | `/api/admin/quizzes/[id]` | Admin | Delete a quiz and its questions |

## Deploying to Vercel (free tier)

The app uses Supabase for data and auth, so Vercel's free **Hobby** tier is enough.

1. Push to GitHub.
2. On [vercel.com](https://vercel.com), **Add New → Project** and import the repo.
3. Add the environment variables (same as `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAILS`
4. Deploy.

## Security notes

- Correct answers and explanations never reach the browser until after submission — grading is server-side.
- Writes and cross-user reads use the service-role key from API routes that verify admin access first; Row Level Security guards direct table access.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be prefixed with `NEXT_PUBLIC_`.

## License

MIT
