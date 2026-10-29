# Features

Feature-by-feature status and reference parity. Status legend:

- ✅ **Done** — implemented and verified.
- 🔑 **Key-gated** — implemented; shows a "coming soon" state until an external key/config is added.
- 💎 **Premium-gated** — implemented; requires a premium account (entitlement modeled, billing not yet wired).
- ⛔ **Blocked** — cannot be completed from our side right now (external dependency).
- 🚧 **Planned** — not built yet.

For the behavior contract see [SPEC.md](SPEC.md); for divergences from the reference see [docs/known-differences.md](known-differences.md); for how closely the build matches the reference see [docs/match-report.md](match-report.md).

## Feature matrix

| Feature | Status | Notes |
|---|---|---|
| Homepage + marketing pages | ✅ | `/`, `/how-it-works`, `/syllabus-changes`, `/privacy`, `/terms` |
| Navigation, footer, dark mode | ✅ | tokens-driven; mobile menu |
| PYQ browse (branch → subject → topic) | ✅ | 20 branches, 213 subjects, 559 real questions |
| PYQ quiz mode + attempts | ✅ | attempts recorded; grading honest |
| Verified answer keys | ⛔ | blocked by upstream grading 500; see below |
| Mock papers (metadata) | ✅ | 80 papers, real title/totals/difficulty/subject split |
| Full mock-paper question sets | 🚧 | auth-gated upstream, not collected; paper pages gate on sign-in |
| AI doubt engine | 🔑 | needs `ANTHROPIC_API_KEY`; coming-soon otherwise |
| AI doubt daily limit (free 5/day) | ✅ | server-enforced |
| Rank predictor | ✅ | historical-stats model, labelled an estimate; unit-tested |
| Cutoffs | ✅ | 120 real cutoff rows |
| Study rooms (create/join by key) | ✅ | membership authorization-checked |
| Room focus timer | ✅ | |
| Room chat | ✅ | HTTP polling (~4s) |
| Room presence | ✅ | in-process memory |
| Room shared files | ✅ API / 🚧 UI | `RoomFile` API exists; owner "share from storage" UI pending |
| Virtual library world | ✅ | 2D canvas, WASD, zones, presence (approx. art) |
| Library content / resources | ✅ | 5 real collected PDFs live on `/library/content` |
| Dashboard (activity, goal, streak) | ✅ | |
| Leaderboard | ✅ | ranked by verified study time |
| Topic heatmap | 💎 | premium-gated |
| Per-user storage | ✅ | visibility + access tier; quota enforcement 🚧 |
| Auth (Google + dev login) | ✅ | Auth.js, JWT; Google works once keys set |
| Premium entitlement gating | ✅ | `User.plan` / `isPremium` |
| Subscription / billing / checkout | 🚧 | money half missing; issue #9; needs processor decision |
| Global study chat (premium) | 🚧 | not observable on a free account during audit |

## Reproduced reference defects

These are defects on the reference, reproduced intentionally and documented, not bugs in this build:

- `/daily` ("Daily PYQ") → 404 (dead link upstream).
- `/referral` ("Invite friends") → 404 (dead link upstream).
- Dashboard benchmark/reminder widgets omitted (upstream endpoints returned 500).

## Blocked: verified answer keys

The reference never exposes correct answers; grading is server-side only. The owner-run `scripts/collect-answers.console.js` derives keys through the grading endpoint, but `POST /api/pyq/attempts` on the reference is **currently returning HTTP 500 ("Failed to update attempt")** — it worked during the initial audit and has since broken upstream. Until it recovers, questions are flagged "answer key not yet verified" and grading reports that honestly. Re-run the collector when the upstream endpoint is healthy, then `npm run db:seed`.

## Roadmap

The actionable backlog is tracked in [docs/next_steps.md](next_steps.md) and as GitHub issues (#9–#17). Highlights: subscription/billing, full interactive mock-paper runner, mistake/bookmark bank, room file-sharing UI, storage quotas, Playwright e2e suite, and moving presence to a shared store.
