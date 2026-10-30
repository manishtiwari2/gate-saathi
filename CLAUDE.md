# CLAUDE.md

Guidance for Claude Code (and any AI coding agent) working in this repository. Humans will find it useful too, but it is written to be loaded into an agent's context, so it is dense and specific.

## What this project is

GATE Saathi is a full-stack GATE exam-prep platform and an authorized reconstruction of the live site at `https://www.padhaishuru.com`. For the product definition see [SPEC.md](docs/SPEC.md); for the technical layout see [ARCHITECTURE.md](docs/ARCHITECTURE.md); for feature-by-feature status see [FEATURES.md](docs/FEATURES.md); for current state see [STATUS.md](docs/STATUS.md).

Everything in the app is built on **real collected data** from the reference site. Do not fabricate content, questions, answers, cutoffs, or resources. When data could not be collected, the app says so honestly (for example, an unverified answer key) rather than inventing a value.

## Core rules

1. **No mock or fabricated data.** Real data only. If a value cannot be collected, surface the gap honestly in the UI and record it in [docs/known-differences.md](docs/known-differences.md).
2. **Key-gated features degrade to "coming soon", never to errors or fake output.** The AI doubt engine renders a coming-soon card when `ANTHROPIC_API_KEY` is unset. Follow this pattern for any future feature that needs an external key.
3. **Match the reference** in appearance, structure, navigation, and behavior. Reproduce the reference's own defects as documented defects (for example, `/daily` and `/referral` 404) rather than silently "fixing" them.
4. **Conventional Commits + feature branches + PRs.** Never commit straight to `main`. See [CONTRIBUTING.md](docs/CONTRIBUTING.md).

## Commands

```bash
npm run dev           # dev server at http://localhost:3000
npm run build         # production build (must stay clean)
npm run lint          # eslint
npm run typecheck     # tsc --noEmit (must stay clean)
npm test              # vitest unit tests (must stay green)
npm run test:e2e      # playwright e2e (needs the seeded local DB)

docker compose up -d  # local Postgres (required for dev, tests and e2e)
npm run db:migrate    # prisma migrate dev
npm run db:seed       # seed from data/ (tsx scripts/seed.ts); keeps attempt history
npm run db:reset      # prisma migrate reset --force, then re-seed
npm run keys:import   # official answer keys from data/pyq/official-keys/*.csv (old PYQ bank)
python scripts/official-papers/build.py "<folder of official GATE CS PDFs>"  # rebuild /papers PDFs + printed keys
```

Before claiming a change works, run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Only claim what you actually ran.

## Gotchas (these have bitten us)

- **Restart the dev server after `prisma generate` or `prisma migrate`.** The running server holds a stale Prisma client and the symptom is a confusing API 500 with an empty body. This is the single most common false alarm in this repo.
- **Prisma CLI reads `.env`, not `.env.local`.** `DATABASE_URL` and `DIRECT_URL` must be in `.env` for `prisma migrate`/`generate` to work. The app and the seed script read both; `scripts/seed.ts` has its own small dotenv loader at the top.
- **Postgres only.** Local dev uses `docker compose up -d`; production uses Supabase (transaction pooler `DATABASE_URL`, session pooler `DIRECT_URL`). **Every table has row-level security enabled with no policies** so Supabase's public Data API can't read it (Prisma is the owner and bypasses RLS): any migration that creates a table must also `ENABLE ROW LEVEL SECURITY` on it. The old SQLite migrations were replaced by the `0_init` baseline.
- **Deployed on Netlify (serverless, US East); Render runs the same app as a backup host.** Don't keep state in module memory and expect other requests to see it. Rate limits and library presence go through `src/lib/kv.ts` (Upstash, with an in-memory fallback locally); the AI daily limit is enforced in the database. Never write to the filesystem at runtime. Function request/response bodies are capped at a few MB, so user uploads go browser → Supabase Storage via signed URLs (`src/lib/supabase-storage.ts`, `uploadBackend()` in `src/lib/storage.ts`); never stream file bytes through a route. See [docs/DEPLOY.md](docs/DEPLOY.md).
- **Auth is Supabase Auth (Google, GitHub)**, but the app's own `User` table is the source of truth, matched by *verified* email (`src/lib/auth.ts`). `getCurrentUser()` is the only way routes learn who is signed in. `src/middleware.ts` refreshes Supabase session cookies. The dev login (`ENABLE_DEV_LOGIN`) is a plain cookie and is never honoured in production.
- **Secrets stay server-side.** Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` may be public. `SUPABASE_SECRET_KEY` must never get a `NEXT_PUBLIC_` prefix or be imported from a client component.
- **Tailwind v4 is pinned** to `tailwindcss@4.3.3` and `@tailwindcss/postcss@4.3.3`. A version skew between the core and the oxide scanner throws `Missing field 'negated' on ScannerOptions.sources`. Keep both pinned to the same version.
- **Design tokens live in `src/styles/globals.css`** as CSS variables on `:root` with a `.dark` override. Do not hardcode colors in components; use `var(--...)`. Core tokens: `--background #faf8f5`, `--foreground #1a1a1a`, `--accent #a3640b` (WCAG AA with white text), plus `--accent-foreground` for text on an accent fill (dark text in dark mode). Never put `text-white` on `--accent`. Fonts: Inter (body) + Playfair Display (display headings), via `next/font`.
- **Realtime is HTTP polling, not websockets** — this matches the reference. Room chat polls every 4s, members every 5s (30s heartbeat), library presence every 3s while the tab is visible. These are sized for free Netlify/Upstash quotas; don't tighten them casually.
- **Official papers (`/papers`) are the primary CS practice.** PDFs in `public/papers/cs/` (key pages stripped), keys in `data/papers/official/keys/*.csv`. A paper is gradeable only if its key file passes the seed's checks (65 Q, 100 marks); never send a key to the browser before the student answers. Keys must come from the organising institute, never a coaching institute.
- **Answer keys and library PDFs are owner-collected** via browser-console scripts (`scripts/collect-*.console.js`), because they require the owner's own authenticated session on the live site. They are not run automatically. The answer-key collector is currently blocked by an upstream 500 on the reference — see [STATUS.md](docs/STATUS.md).

## Repository map

```
src/app          routes + API route handlers (see docs/page-inventory.md)
src/app/api      REST route handlers, one folder per resource
src/components   home/, layout/, pyq/, ui/ (ui = token-driven primitives)
src/lib          db, auth, session, anthropic, predictor, stats, branches, rooms
src/styles       globals.css (design tokens)
prisma           schema.prisma + migrations
scripts          seed.ts + owner-run collectors
data             collected reference data (JSON, CSV)
storage          library/ (committed, authorized) + user/ (gitignored uploads)
docs             audit, inventories, known differences, match report, screenshots
.github          CI/deploy workflows, PR + issue templates
```

## Security invariants (do not regress)

- `GET /api/user/files/[id]` is **owner-only** (`file.userId !== user.id` → 403). Do not reintroduce a published-file bypass here; published files are served by `GET /api/library/document/[id]`.
- Premium content is gated: `if (file.accessTier === "premium" && !user.isPremium) return 403`.
- File responses set safe headers (nosniff, sandbox CSP, inline only for an allowlist of MIME types).
- Validate API input with zod. Never put secrets in the repo; `.env.example` only.

See [SECURITY.md](docs/SECURITY.md) for the reporting policy.
