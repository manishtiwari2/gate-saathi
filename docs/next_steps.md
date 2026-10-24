# Next Steps

Running backlog for GATE Saathi. Grouped by priority. GitHub issues track the discrete items.

## Do now (owner-run, unblocks real data)

- [ ] Run `scripts/collect-answers.console.js` in the padhaishuru.com browser console → `data/pyq/answers.json`, then `npm run db:seed`. Gives real MCQ answer keys so grading verifies answers instead of reporting "unverified".
- [ ] Run `scripts/collect-resources.console.js` → move 9 files to `storage/library/`, manifest to `data/misc/library-manifest.json`. Populates the virtual library resources.

## Deployment / config

- [ ] Provision Postgres (Supabase). Set `datasource provider = "postgresql"` + `DATABASE_URL`, run `npx prisma migrate deploy`, `npm run db:seed`.
- [ ] Add Google OAuth (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`) for real sign-in; disable `ENABLE_DEV_LOGIN` in prod.
- [ ] Add `ANTHROPIC_API_KEY` to enable the AI doubt engine (otherwise coming-soon).
- [ ] Pick a host. Presence (library world + room chat) uses in-process memory → needs a single long-running Node instance, or move presence to a shared store (Redis) for multi-instance.

## Features

- [ ] **Subscription / billing** (big): Razorpay or Stripe, `Subscription` model, `/pricing`, checkout API, signed webhook to flip `plan`, billing section on `/profile`. Entitlement gating already exists (`isPremium`), only the money half is missing. See issue.
- [ ] Full mock-paper practice (currently sign-in gated, not interactive) — build the paper runner using the PYQ grading engine.
- [ ] Mistake / bookmark bank from `QuestionAttempt` data.
- [ ] Global study chat (premium).
- [ ] Shared files into rooms: wire the room owner "share from storage" action (API `RoomFile` exists; UI hook pending).
- [ ] Storage quota enforcement per plan.

## Quality / tech debt

- [ ] Playwright e2e suite (config + first flows: auth, quiz grading, room create/chat, predictor). `test:e2e` script exists; no specs yet.
- [ ] Move library presence off in-process memory to a shared store for horizontal scaling.
- [ ] Rate-limit public/auth API routes.
- [ ] Replace per-item sequential DB writes in `scripts/seed.ts` with batched `createMany` for faster seeding.

## Reference-parity gaps (documented in docs/known-differences.md)

- [ ] Full mock-paper question sets were auth-gated upstream, not collected — paper pages show metadata only.
- [ ] Premium-only surfaces (heatmap data, global chat) not fully observable on a free account.
- [ ] Payment flow UI references Premium but no processor wired (see subscription item).
