# Implementation Plan

## Stack

Single Next.js app matching the original's shape.

- Next.js 15 (App Router) + TypeScript + React 19
- Tailwind CSS v4 with the extracted design tokens
- Prisma ORM over SQLite by default (`DATABASE_URL`), schema kept Postgres-compatible for a later swap
- Auth.js (NextAuth) with a Google provider + a dev credentials provider so the app runs without Google keys
- Study-room/library presence + chat via HTTP polling route handlers (mirrors the original; no websocket server needed)
- AI doubt engine via the Anthropic API (`claude-haiku-5-5`), with a deterministic offline mock when `ANTHROPIC_API_KEY` is absent; 5/day free limit enforced server-side
- Local-disk file storage under `storage/` with DB metadata
- Vitest (unit: predictor math, quiz scoring, normalizers) + Playwright (e2e)

## Repository layout

```
src/
  app/                 # routes mirroring the page inventory
    (marketing)/       # /, how-it-works, syllabus-changes, privacy, terms
    pyqs/, predicted-papers/, predictor/, cutoffs/
    doubts/, library/, rooms/, dashboard/, leaderboard/, heatmap/, storage/, profile/, login/
    api/               # route handlers grouped by feature
  components/
    layout/ ui/ home/ pyq/ papers/ rooms/ library/ account/ tools/
  lib/                 # db, auth, api helpers, predictor, quiz, formatting
  styles/
prisma/
  schema.prisma        # seed from data/
scripts/
  collect-resources.mjs   # owner-run: download library PDFs via their session
  collect-answers.mjs     # owner-run: derive MCQ answer keys via grading endpoint
  seed.ts
data/                  # collected reference data (committed)
docs/
```

## Data seeding

- PYQ: seed branches, subjects, topics, questions from `data/pyq/*`. Answer keys come from `data/pyq/answers-*.json` once the owner runs `collect-answers.mjs`; questions without a verified key are flagged `answerVerified=false` and the quiz marks them "key unverified".
- Papers: seed per-branch metadata from `data/papers/*`. Full paper question sets were auth-gated upstream and were not collected — the paper detail page shows the metadata and a "full paper requires sign-in" state, documented in known-differences.
- Cutoffs: seed from `data/misc/cutoffs.json`.
- Library resources: metadata from `data/misc/resources.json`; PDFs placed under `storage/library/` after the owner runs `collect-resources.mjs`. Missing binaries render as "file unavailable", never fabricated.

## Build order (one coherent slice per PR into `main`)

1. `chore/scaffold` — Next app, Tailwind tokens, Prisma, lint/format, CI, base layout (nav + footer + theme toggle + mobile menu), 404 page. Home page.
2. `feat/pyq` — `/pyqs`, `/pyqs/{branch}`, browse + quiz, branch search, grading endpoint.
3. `feat/gate-tools` — `/predicted-papers(/{branch})`, `/predictor`, `/cutoffs`, `/syllabus-changes`, `/how-it-works`, `/privacy`, `/terms`.
4. `feat/auth` — Auth.js (Google + dev), `/login`, user menu, profile.
5. `feat/rooms` — rooms list/create/join, room detail, focus timer, chat, members, files (polling).
6. `feat/account` — dashboard, study sessions/stats, leaderboard, heatmap (premium-gated), storage.
7. `feat/library` — library landing, 2D world canvas + multiplayer polling, resources panel, document viewer.
8. `feat/doubts` — AI doubt engine with daily limit + offline mock.
9. `chore/polish` — loading/empty/error states, a11y pass, visual diff fixes, docs.

## Verification

- `npm run build` clean, `npm run lint`, `npm test` (Vitest) green.
- Playwright e2e per route at 1440 and 390 widths; side-by-side vs `docs/reference-screenshots/`.
- Interactive checks: theme toggle, mobile menu, quiz answering, room create/join across two contexts, chat send/receive, focus timer, predictor calc, cutoff filter.
- `npm audit`; no secrets committed (`.env.example` only).

## Deviations from the brief (flag in final report)

- SQLite default instead of Postgres (brief allows "if required"); swap via `DATABASE_URL`.
- Realtime via polling, not websockets — this matches the original, which polls.
