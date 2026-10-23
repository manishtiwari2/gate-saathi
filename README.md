# GATE Saathi

A GATE exam-prep platform where students study together: private study rooms with a focus
timer, chat and shared files; a virtual library; previous-year questions (PYQs) with browse and
quiz modes; trend-based mock papers; an AI doubt engine; a rank predictor; cutoffs; streaks,
leaderboards and a topic heatmap.

This is a full-stack reconstruction of the PadhaiShuru website, rebuilt from a public audit of
the live site. See [`docs/`](docs/) for the audit, page inventory, resource inventory and the
list of known differences from the reference.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (design tokens extracted from the reference — see `src/styles/globals.css`)
- Prisma ORM over SQLite by default (Postgres-compatible via `DATABASE_URL`)
- Auth.js (NextAuth): Google provider + a dev credentials fallback
- Study-room presence and chat via polling route handlers (matches the original)
- Anthropic API for the AI doubt engine, with an offline mock fallback
- Vitest (unit) + Playwright (e2e)

## Getting started

```bash
npm install
cp .env.example .env.local      # fill in as needed; defaults run out of the box
npx prisma migrate dev          # create the SQLite database
npm run db:seed                 # seed branches, PYQs, papers, cutoffs from data/
npm run dev                     # http://localhost:3000
```

The app runs without any external keys: dev login is enabled, and the AI doubt engine shows a
"coming soon" state when `ANTHROPIC_API_KEY` is absent (it never fabricates an answer). Add Google
OAuth and an Anthropic key in `.env.local` to enable real sign-in and live AI answers.

### Using Postgres / Supabase (production)

SQLite is the local default. To use Postgres (e.g. Supabase, matching the original's backend):

1. In `prisma/schema.prisma`, set `datasource db { provider = "postgresql" }`.
2. Set `DATABASE_URL` to your Postgres connection string (Supabase gives you one).
3. `npx prisma migrate deploy` (or `migrate dev` locally), then `npm run db:seed`.

No application code changes are needed — all data access goes through Prisma.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` / `npm run typecheck` | Lint / type-check |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run db:migrate` / `db:seed` / `db:reset` | Database lifecycle |

## Reference-data collection (owner-run)

Two datasets can only be collected from the live site with the owner's own session, so they are
provided as browser-console scripts rather than run automatically:

- `scripts/collect-answers.console.js` — derives verified MCQ answer keys via the grading endpoint.
- `scripts/collect-resources.console.js` — downloads the published library PDFs.

Run instructions are in each file's header. Outputs go to `data/pyq/answers.json` and
`storage/library/` + `data/misc/library-manifest.json`. The app works without them; questions
without a verified key are flagged accordingly.

## Project layout

```
src/app         routes (see docs/page-inventory.md)
src/components   layout, ui primitives, feature components
src/lib          db, auth, domain helpers
prisma           schema + migrations
scripts          seed + owner-run collectors
data             collected reference data
docs             audit, inventories, known differences, screenshots
```
