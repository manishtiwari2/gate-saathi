# Architecture

Technical design of GATE Saathi. For what the product does see [SPEC.md](SPEC.md); for day-to-day conventions see [CLAUDE.md](../CLAUDE.md).

## Overview

A single Next.js 15 application (App Router) that serves both the UI and the REST API, backed by Prisma over Postgres (Docker locally, Neon in production), deployed on Vercel. This mirrors the reference, which is also a single Next.js app. There is no separate backend service.

```
Browser ──▶ Next.js (App Router)
              ├── Server Components ─────▶ Prisma ──▶ Postgres
              ├── Route handlers (/api) ─▶ Prisma
              │                          └▶ Anthropic Messages API (AI doubts)
              └── Client Components ─────▶ polling the /api routes (chat, presence)
```

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript | matches the reference |
| Styling | Tailwind CSS v4 (pinned 4.3.3) | tokens in `src/styles/globals.css` |
| ORM / DB | Prisma 6 over Postgres | Docker locally, Neon in production; `DIRECT_URL` for migrations |
| Auth | Auth.js (NextAuth 4), Google + dev credentials | JWT sessions, Prisma adapter |
| AI | Anthropic Messages API (`claude-haiku-5-5`) | coming-soon when key absent |
| Realtime | HTTP polling | matches the reference; no websockets |
| Validation | zod | on API route input |
| Tests | Vitest (unit) + Playwright (e2e) | |
| CI/CD | GitHub Actions | `ci.yml`, `deploy.yml` |

## Rendering model

- **Server Components** read data directly through Prisma for first paint (listings, metadata pages).
- **Client Components** handle interactive and realtime surfaces (quiz, rooms chat, library world, theme toggle) and talk to the `/api` route handlers.
- Several reference pages are client-rendered with empty SSR bodies (doubts, rooms, login, dashboard, cutoffs, storage); the reconstruction follows the same split.

## Data model (Prisma)

Defined in `prisma/schema.prisma`. Entities:

- **Auth / user**: `User` (`plan` = `free` | `premium`), `Account`, `Session`, `VerificationToken`.
- **Content**: `Branch`, `Subject`, `Topic`, `Question` (`correctAnswer?`, `answerVerified`), `Paper`, `Cutoff` (per year/branch/category with applicant and qualified totals, qualifying rate, max marks).
- **Activity**: `QuestionAttempt`, `StudySession`, `DoubtQuery`.
- **Rooms**: `Room`, `RoomMember`, `RoomMessage`, `RoomFile`.
- **Storage**: `UserFile` (`visibility`, `accessTier`, `branch`, `storagePath`).

Migrations: `init`, `cutoff_fields`, `doubt_query`. Entitlement is `User.plan`; `isPremium` is derived in `src/lib/session.ts`.

## API surface

Route handlers under `src/app/api`, one folder per resource:

```
auth/[...nextauth]          auth/profile          profile
pyq/branches                pyq/branches/[code]/subjects
pyq/questions               pyq/questions/[id]    pyq/attempts
pyq/analytics/heatmap       predicted-papers      predicted-papers/[branch]
predictor                   cutoffs               leaderboard
content/resources           library/document/[id] library/multiplayer
rooms  rooms/[id]  rooms/[id]/{members,messages,files}  rooms/join
study/sessions  study/stats
user/files  user/files/[id]
ai/doubt  ai/doubt/free
```

## Key modules (`src/lib`)

- `db.ts` — Prisma client singleton.
- `auth.ts` / `session.ts` — NextAuth config; `getCurrentUser()`, `requireUser()`, derived `isPremium`.
- `anthropic.ts` — `answerDoubt()` returns `{ available: false }` when no key, else calls the Messages API; `isAiConfigured()`.
- `predictor.ts` — `estimateRank()` exponential-decay model over historical stats (unit-tested).
- `stats.ts` — `dailyTotals()`, `computeStreak()` (unit-tested).
- `branches.ts` — the 20 GATE branches in display order.
- `rooms.ts` — room helpers.

## Realtime

HTTP polling, chosen to match the reference (which polls rather than using websockets):

- Rooms chat polls roughly every 4s.
- Library presence polls roughly every 3s (paused while the tab is hidden), stored in Upstash Redis when configured.

Library presence and rate-limit counters live in **Upstash Redis** when it is configured (`src/lib/kv.ts`), so they work across Vercel's serverless instances; locally they fall back to process memory. Room presence uses the `RoomMember.lastSeenAt` column, and the AI daily limit is enforced in the database.

## Security

- File download by id (`/api/user/files/[id]`) is owner-only; published files are served separately by `/api/library/document/[id]`, which enforces the premium gate.
- Safe response headers on file streams: `X-Content-Type-Options: nosniff`, a sandbox CSP, and inline rendering only for an allowlist of MIME types.
- zod validation on API input. No secrets in the repo (`.env.example` only). See [SECURITY.md](SECURITY.md).

## Data pipeline

Reference data in `data/` is seeded by `scripts/seed.ts` (idempotent: it resets the content tables and re-inserts). Two datasets require the owner's authenticated session on the live site and are collected by browser-console scripts rather than automatically:

- `scripts/collect-answers.console.js` → `data/pyq/answers.json` (verified MCQ keys).
- `scripts/collect-resources.console.js` → `storage/library/` + `data/misc/library-manifest.json` (library PDFs).

The app runs fully without either; see [STATUS.md](STATUS.md) for their current state.

## Deployment notes

Production runs free on Vercel + Neon + Upstash; see [DEPLOY.md](DEPLOY.md). `vercel-build` applies migrations before `next build`. User uploads are off on Vercel (no persistent disk) until object storage is added.
