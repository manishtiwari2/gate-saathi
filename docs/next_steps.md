# Next Steps

Running backlog for GATE Saathi. Grouped by priority. GitHub issues track the discrete items.

## Do now (owner-run, unblocks real data)

- [ ] Add the official answer keys for the 23 "paper only" official papers, newest first (2026 → 2021): download each year's official key from the organising institute and transcribe it to `data/papers/official/keys/<id>.csv` (format in `data/papers/official/README.md`), then `npm run db:seed`.

- [ ] Run `scripts/collect-answers.console.js` in the padhaishuru.com browser console → `data/pyq/answers.json`, then `npm run db:seed`. Gives real MCQ answer keys so grading verifies answers instead of reporting "unverified".
- [ ] Run `scripts/collect-resources.console.js` → move 9 files to `storage/library/`, manifest to `data/misc/library-manifest.json`. Populates the virtual library resources.

## Deployment / config

- [x] Postgres everywhere (Docker locally, Supabase in production); `0_init` baseline migration; RLS on every table.
- [x] Supabase Auth (Google, GitHub) replaces NextAuth.
- [ ] Enable the Google and GitHub providers in the Supabase dashboard.
- [ ] Add `ANTHROPIC_API_KEY` to enable the AI doubt engine (otherwise coming-soon).
- [x] Pick a host: Netlify + Supabase + Upstash (free), Render as backup, all in US East. Steps in [DEPLOY.md](DEPLOY.md).
- [x] Object storage for uploads: Supabase Storage with signed URLs.

## Features

- [ ] **Subscription / billing** (big): Razorpay or Stripe, `Subscription` model, `/pricing`, checkout API, signed webhook to flip `plan`, billing section on `/profile`. Entitlement gating already exists (`isPremium`), only the money half is missing. See issue.
- [ ] Full mock-paper practice (currently sign-in gated, not interactive) — build the paper runner using the PYQ grading engine.
- [ ] Mistake / bookmark bank from `QuestionAttempt` data.
- [ ] Global study chat (premium).
- [ ] Shared files into rooms: wire the room owner "share from storage" action (API `RoomFile` exists; UI hook pending).
- [ ] Storage quota enforcement per plan.

## Quality / tech debt

- [x] Playwright e2e suite (PYQ practice, predictor, sign-in → rooms → chat → timer, mobile sign-out), run in CI.
- [x] Library presence and rate limits use a shared store (Upstash) for serverless.
- [x] Rate-limit public/auth API routes.
- [ ] Replace per-item sequential DB writes in `scripts/seed.ts` with batched `createMany` for faster seeding.

## Reference-parity gaps (documented in docs/known-differences.md)

- [ ] Full mock-paper question sets were auth-gated upstream, not collected — paper pages show metadata only.
- [ ] Premium-only surfaces (heatmap data, global chat) not fully observable on a free account.
- [ ] Payment flow UI references Premium but no processor wired (see subscription item).
