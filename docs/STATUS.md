# Project Status

Point-in-time snapshot of where GATE Saathi stands. The forward-looking backlog lives in [docs/next_steps.md](next_steps.md); feature-level status is in [FEATURES.md](FEATURES.md). This file is the quick "where are we" answer.

**Last updated:** 2026-10-24 · **Branch:** `main` · **Build:** typecheck / lint / unit tests / `next build` all clean.

## Summary

The reconstruction is **functionally complete** and runs end to end on real collected data. Two items remain, both external to the codebase: verified answer keys are blocked upstream, and the subscription/billing half needs a product decision before it is built.

## Done and verified

- All reference routes reconstructed (24 pages) plus auth sub-routes.
- Real seeded data: 20 branches, 213 subjects, 559 questions, 80 papers, 120 cutoffs.
- 5 real library PDFs collected and served on `/library/content`.
- Official GATE CS papers 2007–2026 on `/papers` (32 papers); 9 with official answer keys support practice checking and a timed 3-hour mock with GATE marking.
- Auth (Google + dev login), study rooms with chat/timer/presence (polling), virtual library world, rank predictor, cutoffs, dashboard, leaderboard, storage.
- Premium entitlement gating (`User.plan` / `isPremium`).
- CI and deploy GitHub Actions workflows.
- Unit tests for predictor and stats; typecheck, lint, and production build all clean.
- Full docs set: this file plus SPEC, ARCHITECTURE, FEATURES, CONTRIBUTING, CLAUDE, and the `docs/` audit/inventory/known-differences set.
- GitHub issues #9–#17 filed for the backlog.

## Blocked (external)

- **Verified MCQ answer keys.** `POST /api/pyq/attempts` on the reference returns HTTP 500 ("Failed to update attempt"). The owner-run `scripts/collect-answers.console.js` cannot derive keys until the upstream endpoint recovers. The app grades honestly ("answer key not yet verified") meanwhile. **Action when upstream recovers:** re-run the collector, then `npm run db:seed`.

## Awaiting a decision

- **Subscription / billing (issue #9).** Entitlement gating exists; the money half (processor, `Subscription` model, `/pricing`, checkout, signed webhook, billing UI) is not built. Needs: pick Razorpay or Stripe, and confirm which features gate behind it. Payment is money-handling, so the approach is confirmed before building.

## Optional before production

- Create the free Neon database and run `prisma migrate deploy` + `npm run db:seed` against it (see DEPLOY.md).
- Add `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`; disable dev login in production.
- Add `ANTHROPIC_API_KEY` to turn the AI doubt engine on (coming-soon until then).
- Deploy on Vercel + Neon + Upstash following [DEPLOY.md](DEPLOY.md) (presence and rate limits already use the shared store).

## Deferred / gaps (documented)

Full interactive mock-paper runner, mistake/bookmark bank, room file-sharing UI, storage quotas, Playwright e2e specs, and the reference-parity data gaps are all recorded in [docs/next_steps.md](next_steps.md) and [docs/known-differences.md](known-differences.md).
