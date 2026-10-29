<div align="center">

# 🎓 GATE Saathi

**Prepare for GATE together — not alone.**

A full-stack study platform with shared focus rooms, a virtual library, a real
question bank, trend-based mock papers, an AI doubt engine, and a rank predictor.


![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/tests-vitest%20%2B%20playwright-6E9F18?logo=vitest&logoColor=white)
![License](https://img.shields.io/badge/license-Proprietary-red)

</div>

---

## Table of contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Database](#database)
- [Scripts](#scripts)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Reference-data collection](#reference-data-collection)
- [Deployment](#deployment)
- [Roadmap & status](#roadmap--status)
- [Documentation](#documentation)
- [License](#license)

## Overview

GATE Saathi is a GATE (Graduate Aptitude Test in Engineering) exam-prep platform
built around **studying with friends**: private study rooms with a focus timer,
chat and shared files; a top-down virtual library "world"; previous-year
questions (PYQs) with browse and quiz modes; trend-based mock papers; an AI doubt
engine; a rank predictor; historical cutoffs; and streaks, leaderboards and a
topic heatmap to keep momentum.

It is a single Next.js 15 application serving both the UI and a typed REST API,
backed by Prisma and Postgres. Locally it needs only Docker for the database:
dev login and a graceful "coming soon" state for the AI engine mean no external
accounts. In production it runs free on Vercel + Neon + Upstash, with Google
OAuth and the Anthropic API switched on by environment variables.

**Built on real data.** Every question, paper, cutoff and resource is collected
from the authorized reference site. Where data could not be collected, the app
says so honestly rather than fabricating a value.

## Screenshots

| Home | PYQ quiz |
|---|---|
| ![Home](docs/impl-screenshots/home.png) | ![PYQs](docs/impl-screenshots/pyqs-cs-databases.png) |

| Virtual library world | Study-room chat |
|---|---|
| ![Library world](docs/impl-screenshots/library-world.png) | ![Room chat](docs/impl-screenshots/room-chat.png) |

## Features

- 📚 **PYQ library** — 20 GATE branches, 213 subjects, 559 real questions; browse and timed quiz modes with recorded attempts and honest grading.
- 📝 **Mock papers** — trend-based predicted papers with real metadata (totals, difficulty split, subject breakdown).
- 🤖 **AI doubt engine** — ask a doubt, get an answer from the Anthropic API; free-tier daily limit; degrades to "coming soon" when no key is set (never a fake answer).
- 📈 **Rank predictor** — estimates rank from a GATE score using historical qualifying statistics, transparently labelled an estimate.
- 📊 **Cutoffs** — historical qualifying cutoffs per branch, year and category.
- 👥 **Study rooms** — create/join by key, shared focus timer, live chat and member presence (HTTP polling), shared files.
- 🏛️ **Virtual library world** — a 2D canvas with WASD movement, zones and live presence.
- 🔥 **Dashboard, streaks, leaderboard, heatmap** — activity tracking, daily goals, study-time leaderboard, and a premium topic heatmap.
- 🔐 **Auth** — Google sign-in (Auth.js) with a local dev-login fallback.
- 💎 **Premium entitlement** — gating is modeled end to end (`User.plan` / `isPremium`).

Full feature-by-feature status and reference parity: [FEATURES.md](docs/FEATURES.md).

## Tech stack

| Area | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript 5.7 |
| Styling | Tailwind CSS v4, design tokens extracted from the reference |
| Database | Prisma 6 ORM over Postgres (Docker locally, Neon in production) |
| Auth | Auth.js (NextAuth 4) — Google + dev credentials, JWT sessions |
| AI | Anthropic Messages API (`claude-haiku-5-5`) |
| Realtime | HTTP polling (matches the reference) |
| Validation | zod |
| Testing | Vitest (unit) + Playwright (e2e) |
| CI/CD | GitHub Actions |

## Quick start

**Prerequisites:** Node.js 20+, npm, and Docker (for the local Postgres database).
No external accounts are needed for local development.

```bash
# 1. Install dependencies
npm install

# 2. Create your env file (defaults work with the Docker database)
cp .env.example .env

# 3. Start Postgres, create the tables and load the data
docker compose up -d
npx prisma migrate deploy
npm run db:seed                 # branches, PYQs, papers, cutoffs from data/

# 4. Start the dev server
npm run dev                     # http://localhost:3000
```

Sign in with the dev-login option, browse the PYQ library, create a study room
and try the predictor, all without any external keys.

> **Note:** use `.env`, not `.env.local`: the Prisma CLI only reads `.env`.
> Restart the dev server after any `prisma migrate` or `prisma generate`.

## Configuration

All configuration is via environment variables in `.env` locally and in the
Vercel project settings in production.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string (Neon's pooled URL in production). |
| `DIRECT_URL` | yes | Unpooled Postgres URL, used by migrations and the seed. Same as `DATABASE_URL` locally. |
| `NEXTAUTH_SECRET` | prod | Session/JWT signing secret. |
| `NEXTAUTH_URL` | prod | Canonical app URL. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | prod | Google sign-in (the only sign-in in production). |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | recommended on Vercel | Shared store for rate limits and library presence. Without it they use process memory. |
| `ANTHROPIC_API_KEY` | optional | Enables the AI doubt engine; otherwise it shows "coming soon". |
| `ENABLE_UPLOADS` | optional | Force user uploads on/off. Default: on, except on Vercel. |
| `ENABLE_DEV_LOGIN` | dev only | Local dev login (any email). Always off in production builds. |

See [`.env.example`](.env.example) for example values.

## Database

Postgres everywhere: Docker locally (`docker-compose.yml`) and Neon in
production. Migrations live in `prisma/migrations` (baseline `0_init`).

```bash
docker compose up -d            # start local Postgres
npx prisma migrate dev          # create a migration after editing schema.prisma
npm run db:seed                 # (re)load data/; keeps users' attempt history
docker compose down             # stop (data persists in a Docker volume)
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run keys:import` | Import official answer keys from `data/pyq/official-keys/` |
| `npm run db:seed` | Seed the database from `data/` |
| `npm run db:reset` | Reset and re-seed the database |

## Testing

```bash
npm run typecheck     # type safety
npm run lint          # linting
npm test              # unit + route-handler tests (Vitest)
npm run build         # production build
npm run test:e2e      # end-to-end tests in a real browser (Playwright)
```

- **Unit tests:** grading, rank predictor, time-zone-aware stats, rate limiting and URL helpers.
- **Route-handler tests** (`src/test/routes.test.ts`): owner-only files, the premium gate, grading, the AI daily limit and presence.
- **End-to-end tests** (`e2e/`): PYQ practice, predictor categories, sign-in → rooms → chat → timer, and mobile sign-out. They need the seeded local database; run `npx playwright install chromium` once first.

CI runs all of it against a Postgres service on every push and pull request.

## Project structure

```
src/app          Routes + REST API route handlers (see docs/page-inventory.md)
src/app/api      One folder per resource (pyq, rooms, study, ai, library, …)
src/components   home/ · layout/ · pyq/ · ui/ (token-driven primitives)
src/lib          db, auth, session, anthropic, predictor, stats, branches, rooms
src/styles       globals.css — design tokens (colors, fonts)
prisma           schema.prisma + migrations
scripts          seed.ts + owner-run data collectors
data             collected reference data (JSON, CSV)
storage          library/ (committed, authorized) · user/ (gitignored uploads)
docs             audit, inventories, known differences, match report, screenshots
.github          CI/deploy workflows, PR + issue templates
```

## Architecture

A single Next.js app renders the UI (Server + Client Components) and serves a
typed REST API that talks to the database through Prisma. Realtime surfaces
(room chat, library presence) use HTTP polling, matching the reference.
Presence is held in process memory, so a consistent multiplayer deployment uses
a single long-running Node instance.

Full details — rendering model, data model, API surface, security invariants and
the data pipeline — are in [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Reference-data collection

Two datasets can only be collected from the live site with the owner's own
authenticated session, so they are provided as browser-console scripts run
manually (not automatically):

- `scripts/collect-answers.console.js` — derives verified MCQ answer keys via the
  grading endpoint → `data/pyq/answers.json`.
- `scripts/collect-resources.console.js` — downloads the published library PDFs →
  `storage/library/` + `data/misc/library-manifest.json`.

Instructions are in each file's header. The app works fully without them;
questions without a verified key are flagged accordingly.

> **Current note:** the reference's grading endpoint is returning HTTP 500, so
> answer-key collection is temporarily blocked upstream. See [STATUS.md](docs/STATUS.md).

## Deployment

Free hosting on **Vercel + Neon + Upstash**, with an optional custom domain.
Step-by-step instructions are in **[docs/DEPLOY.md](docs/DEPLOY.md)**.

- Vercel deploys automatically from GitHub; `vercel-build` applies migrations first.
- Rate limits and library presence use Upstash so they work across serverless instances.
- User uploads are off on Vercel ("coming soon") because there is no persistent disk; the library PDFs ship with the app.
- Vercel Hobby is non-commercial: move to Pro or another host before charging for Premium.

## Roadmap & status

Current state is tracked in [STATUS.md](docs/STATUS.md); the actionable backlog in
[docs/next_steps.md](docs/next_steps.md) and as GitHub issues. Highlights:

- Subscription / billing (Razorpay or Stripe) — entitlement exists, money half pending.
- Interactive full mock-paper runner.
- Mistake / bookmark bank from attempt data.
- Room file-sharing UI, storage quotas.
- Object storage for user uploads on serverless hosting (uploads are off on Vercel for now).

## Documentation

| Doc | What's in it |
|---|---|
| [SPEC.md](docs/SPEC.md) | Product definition and behavior contract |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical design, data model, API surface |
| [FEATURES.md](docs/FEATURES.md) | Feature matrix with status and reference parity |
| [STATUS.md](docs/STATUS.md) | Current-state snapshot |
| [DEPLOY.md](docs/DEPLOY.md) | Free deployment on Vercel + Neon + Upstash, custom domain |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Dev setup, git flow, conventions |
| [CLAUDE.md](CLAUDE.md) | Conventions and gotchas for AI/code agents |
| [SECURITY.md](docs/SECURITY.md) | Vulnerability reporting and security invariants |
| [docs/](docs/) | Audit, page/resource inventories, known differences, match report |

## License

Proprietary — © 2026 Manish Tiwari. All rights reserved. See [LICENSE](LICENSE).
This is a private, authorized reconstruction; reconstructed content remains the
property of its respective owners.
