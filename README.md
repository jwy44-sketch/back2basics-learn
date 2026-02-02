# Back2Basics Learn

A study app for FAR and contracting with adaptive spaced repetition, weak-area targeting, and exam sprint modes.

## Share Mode: progress is stored in your browser only.

In Share Mode, questions and resources are the same for everyone. Each person's progress—proficiency, bookmarks, wrong answers, and attempts—is stored locally in their browser (localStorage). No database is required. No login. Safe for multi-user shared devices: each browser profile has its own progress.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Data:** Static JSON (`/public/questions.json`, `/public/resources.json`)
- **Progress:** localStorage (b2b_progress_v1, b2b_bookmarks_v1, b2b_attempts_v1)
- **Future:** Vercel (web) + Capacitor (iOS)

## Quick Start (Share Mode)

1. **Install dependencies**
   ```powershell
   npm install
   ```

2. **Start the dev server**
   ```powershell
   npm run dev
   ```

3. **Open in browser** — Go to http://localhost:3000

**No Prisma migrate or seed required.** Questions and resources load from `/public/*.json`.

## Windows Setup (Legacy / DB Mode)

If you want to use the database (e.g., for import/seed workflows):

1. Copy `.env.example` to `.env` and ensure `DATABASE_URL` is set.
2. Run `npx prisma migrate dev` to create the database.
3. Run `npm run db:seed` to seed questions and resources.
4. Run `npm run dev`.

## Features

- **Learn Mode:** Adaptive spaced repetition (proficiency 0.2–1.0, mastered ≥0.85)
- **Focus Weak Areas:** 70% from weakest 3 topics, 30% mixed
- **Exam Sprint:** 10/25/50 questions, presets (All Sessions, Session Only, Weak Areas)
- **Wrong Answers:** Review queue for incorrect items
- **Bookmarks:** Star questions for later review
- **Topics:** Filter by session, topic, difficulty; search prompt text
- **Resources:** DAU links (FAR Better View, Skills and Roles, etc.)
- **Settings:** Shuffle toggle, Export JSON, Reset My Progress (clears localStorage)

## Spaced Repetition

- Proficiency: 0.0–1.0 (starts 0.20)
- Correct: +0.15 (cap 1.0)
- Incorrect: -0.20 (floor 0.0)
- Mastered: ≥0.85

## Next Due

- &lt;0.25: 10 min  
- &lt;0.40: 1 hour  
- &lt;0.55: 4 hours  
- &lt;0.70: 1 day  
- &lt;0.85: 3 days  
- ≥0.85: 7 days  

## Shuffle

- All modes shuffle by default (toggle in Settings)
- Learn, Review, Exam, Topic quiz all randomize question order

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run db:migrate` — Run Prisma migrations (optional)
- `npm run db:seed` — Seed database (optional)
- `npm run db:setup` — Migrate + seed (optional)
- `npm run generate:seed` — Regenerate `questions.seed.json`
- `npm run verify:seed` — Verify seed has ≥200 questions

## Regenerating Public JSON

To update `/public/questions.json` from the seed files:

```powershell
node scripts/buildPublicJson.js
```

## iOS / Capacitor (Future)

To package as iOS app:

1. Add Capacitor: `npm install @capacitor/core @capacitor/cli @capacitor/ios`
2. Run `npx cap init`
3. Build: `npm run build`
4. Add iOS: `npx cap add ios`
5. Sync: `npx cap sync`
6. Open in Xcode: `npx cap open ios`

The app works offline; no external APIs required.
