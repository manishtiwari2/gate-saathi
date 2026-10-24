# Contributing

How to develop on GATE Saathi. Read [CLAUDE.md](../CLAUDE.md) for repo-specific gotchas and conventions, [ARCHITECTURE.md](ARCHITECTURE.md) for the technical layout, and [SPEC.md](SPEC.md) for product behavior.

## Prerequisites

- Node.js 20+ and npm.
- No external services required for local development — the app runs out of the box on SQLite with dev login.

## Setup

```bash
npm install
cp .env.example .env.local      # defaults run as-is
npx prisma migrate dev          # create the SQLite database
npm run db:seed                 # seed from data/
npm run dev                     # http://localhost:3000
```

`DATABASE_URL` must also be present in `.env` (not just `.env.local`), because the Prisma CLI reads `.env`.

## Branching and git flow

- `main` is always releasable. Never commit to it directly.
- Branch per unit of work using a type prefix: `feat/`, `fix/`, `docs/`, `chore/`, `refactor/`, `test/`. Example: `feat/mock-paper-runner`.
- Open a pull request into `main`. Keep PRs focused and reviewable.
- When merging, do not delete a base branch that another open PR still targets (a stacked PR auto-closes if its base is deleted). Retarget dependent PRs to `main` first.

## Commits — Conventional Commits

Format: `type(scope): subject`, subject in the imperative mood.

```
feat(rooms): add focus-timer presence sync
fix(pyq): grade only against a verified answer key
docs(architecture): document the polling model
chore(ci): pin tailwind to 4.3.3
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `build`, `ci`. Commit bodies and PR descriptions are written in normal prose for other people to read.

## Quality gates (run before every PR)

```bash
npm run typecheck     # must be clean
npm run lint          # must be clean
npm test              # must be green
npm run build         # must succeed
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, test, and build on every push and PR. A PR should not be merged with CI red. Only state that something works if you actually ran it.

## Coding conventions

- **TypeScript everywhere.** No `any` without a clear reason.
- **Design tokens, not hardcoded colors.** Use the CSS variables from `src/styles/globals.css` (`var(--background)`, `var(--accent)`, …). Both light and dark must look right.
- **Validate API input with zod** in route handlers. Return typed JSON with explicit status codes.
- **Match the surrounding code** — naming, structure, comment density, and idiom. New UI goes in the right `src/components` subfolder (`ui/` for primitives, feature folders otherwise).
- **No fabricated data, ever.** If data is missing, surface the gap honestly and note it in [docs/known-differences.md](known-differences.md). This is a hard project rule.
- **Key-gated features show "coming soon", not errors.** Follow the `ANTHROPIC_API_KEY` pattern in `src/lib/anthropic.ts` for any feature needing external config.

## Database changes

1. Edit `prisma/schema.prisma`.
2. `npm run db:migrate` to create a migration.
3. **Restart the dev server** — it holds a stale Prisma client / SQLite handle otherwise, and the symptom is a confusing API 500 with an empty body.
4. Update `scripts/seed.ts` if the change affects seeded data, and re-seed with `npm run db:seed`.

## Tests

- Unit tests (Vitest) live next to the code they test (`*.test.ts`). Pure logic — predictor, stats, normalizers — should be unit-tested.
- E2e (Playwright) via `npm run test:e2e`. The config/script exists; writing the first specs (auth, quiz grading, room create/chat, predictor) is on the backlog.

## Reference-data collectors

The answer-key and library-PDF datasets require the owner's authenticated session on the live site, so they are browser-console scripts (`scripts/collect-*.console.js`), run manually, with instructions in each file header. Do not try to automate them against the live site from CI.

## Security

Keep the invariants listed in [CLAUDE.md](../CLAUDE.md) and [SECURITY.md](SECURITY.md): owner-only file access, premium gating, safe file headers, no secrets in the repo. Report vulnerabilities per [SECURITY.md](SECURITY.md).
