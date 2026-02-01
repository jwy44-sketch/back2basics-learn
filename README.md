# Back2Basics Learn

A study app for FAR and contracting with adaptive spaced repetition, weak-area targeting, and exam sprint modes.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database:** SQLite via Prisma
- **State:** React Query (TanStack Query)
- **Future:** Vercel (web) + Capacitor (iOS)

## Windows Setup

### Prerequisites

1. **Install Node.js LTS** (20.x recommended)
   - Download from https://nodejs.org/
   - Choose the LTS version
   - Run the installer and follow prompts
   - Verify: open PowerShell and run `node -v` and `npm -v`

### Installation

1. **Open PowerShell** in the project folder (or `cd` to it)

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Run Prisma migration**
   ```powershell
   npx prisma migrate dev
   ```
   - This creates the SQLite database and schema

4. **Seed the database**
   ```powershell
   npm run db:seed
   ```
   - Loads 220+ questions from `data/questions.seed.json` and `data/questions-extra.json`
   - Seeds resources with DAU links

5. **Start the dev server**
   ```powershell
   npm run dev
   ```

6. **Open in browser**
   - Go to http://localhost:3000

### Verify Seed Count

```powershell
npm run verify:seed
```

This checks that `data/questions.seed.json` has at least 200 valid questions.

## Features

- **Learn Mode:** Adaptive spaced repetition (proficiency 0.2–1.0, mastered ≥0.85)
- **Focus Weak Areas:** 70% from weakest 3 topics, 30% mixed
- **Exam Sprint:** 10/25/50 questions, presets (All Sessions, Session Only, Weak Areas)
- **Wrong Answers:** Review queue for incorrect items
- **Bookmarks:** Star questions for later review
- **Topics:** Filter by session, topic, difficulty; search prompt text
- **Resources:** DAU links (FAR Better View, Skills and Roles, etc.)
- **Import/Export:** Admin JSON import/export in Settings

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
- `npm run db:migrate` — Run Prisma migrations
- `npm run db:seed` — Seed database
- `npm run db:setup` — Migrate + seed
- `npm run generate:seed` — Regenerate `questions.seed.json`
- `npm run verify:seed` — Verify seed has ≥200 questions

## iOS / Capacitor (Future)

To package as iOS app:

1. Add Capacitor: `npm install @capacitor/core @capacitor/cli @capacitor/ios`
2. Run `npx cap init`
3. Build: `npm run build`
4. Add iOS: `npx cap add ios`
5. Sync: `npx cap sync`
6. Open in Xcode: `npx cap open ios`

The app works offline once seeded; no external APIs required.
