# Quiz Quest 🎯

A full-stack trivia quiz web app built with **Next.js 16** (App Router), **React 19**, **TypeScript**, and **Tailwind CSS v4**. Deployable on the Vercel free tier with zero external services — no database, no API keys.

## What's included

- **Home page** — a catalog of quizzes with category, difficulty, and question count
- **Quiz player** — one-question-at-a-time flow with progress bar, previous/next navigation, and free revision of answers until you submit
- **Server-side scoring** — answers are graded by a Route Handler; the correct answers and explanations never reach the browser until after you submit
- **Results review** — score breakdown with per-question explanations and a "Try again" reset
- **Fully typed** end to end, plus a custom 404 page

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.3.6 (App Router, Turbopack) |
| UI | React 19.2, Tailwind CSS v4 |
| Language | TypeScript 5 |
| API | Route Handlers (`app/api/.../route.ts`) |
| Data | In-repo question bank (`lib/questions.ts`) — no DB needed |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build & run (production)

```bash
npm run build
npm run start
```

## API reference

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/quizzes` | List all quiz summaries (no answers exposed) |
| `GET` | `/api/quizzes/[id]` | Get one quiz with questions and options — **correct answers are stripped** |
| `POST` | `/api/quizzes/[id]/submit` | Grade answers; returns score and full breakdown |

**Submit body**

```json
{
  "answers": {
    "ge-1": "Himalayas",
    "ge-2": "Sweden"
  }
}
```

Keys are question ids; values are the option strings the player selected. Unanswered questions are graded as incorrect and reported with `"selected": null`.

## Project structure

```
app/
├─ api/quizzes/
│  ├─ route.ts                  # GET /api/quizzes
│  ├─ [id]/route.ts             # GET /api/quizzes/[id]
│  └─ [id]/submit/route.ts      # POST /api/quizzes/[id]/submit
├─ quiz/[id]/
│  ├─ page.tsx                  # Server component: loads quiz, renders player
│  └─ quiz-player.tsx           # Client component: interactive quiz flow
├─ page.tsx                     # Home: quiz catalog
├─ layout.tsx                   # Root layout + metadata
├─ not-found.tsx                # 404 page
└─ globals.css                  # Tailwind v4 + theme
lib/
└─ questions.ts                 # Question bank, types, grading logic
```

## Adding your own questions

Edit `lib/questions.ts` and add an entry to the `QUIZZES` array:

```ts
{
  id: "my-quiz",
  title: "My Quiz",
  description: "A short description.",
  category: "Custom",
  icon: "🎯",
  difficulty: "easy", // "easy" | "medium" | "hard"
  questions: [
    {
      id: "mq-1",
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctIndex: 1,
      explanation: "Two plus two equals four.",
    },
  ],
}
```

The quiz appears on the home page automatically, and the API + dynamic route pick it up with no other changes.

## Deploying to Vercel (free tier)

Since the app needs no database or environment variables, the free **Hobby** tier is enough.

**Option A — Vercel dashboard**

1. Push this project to a GitHub/GitLab/Bitbucket repository.
2. Sign in to [vercel.com](https://vercel.com) and click **Add New → Project**.
3. Import the repository. Vercel auto-detects Next.js — the default build settings are correct:
   - Build command: `next build`
   - Output: handled automatically by the Next.js runtime
4. Click **Deploy**. Your quiz app is live in about a minute.

**Option B — Vercel CLI**

```bash
npm i -g vercel
vercel        # preview deployment
vercel --prod # production deployment
```

No environment variables to configure. The whole app fits comfortably within the Hobby tier limits (static + a few lightweight serverless API routes).

## Notes

- The question bank lives in the repo, so it's easy to fork and customize.
- Correct answers and explanations are never included in the client payload — grading happens on the server in the `POST .../submit` route handler.
- The 404 route handles unknown quiz ids gracefully.

## License

MIT
