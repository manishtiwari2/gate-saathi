# Known Differences from the Reference

Written for: the project owner. Itemizes where GATE Saathi intentionally or unavoidably differs from https://www.padhaishuru.com.

## Intentional

- **Brand**: renamed PadhaiShuru → **GATE Saathi** throughout (including the rebranded legal text).
- **Key-gated features show "coming soon", not errors**: the AI doubt engine renders a coming-soon card when `ANTHROPIC_API_KEY` is unset, rather than failing. Per the owner's instruction.
- **Database**: SQLite by default for zero-setup local runs; Postgres/Supabase-compatible via `DATABASE_URL` (the reference uses Supabase). No schema changes needed to switch.
- **Auth**: Auth.js (NextAuth) with Google + a local dev-login fallback, instead of Supabase Auth. Real Google sign-in works once credentials are set.

## Reference defects reproduced (not bugs in this build)

- `/daily` ("Daily PYQ" in nav/footer) returns 404 — it is a dead link on the original.
- `/referral` ("Invite friends") returns 404 — dead link on the original.
- On the original dashboard, the benchmark and reminders endpoints returned HTTP 500; those widgets are omitted here rather than reproducing broken calls.
- The reference's per-branch/per-subject question counts are internally inconsistent (e.g. CS advertised 487, subjects summed to 846, the list endpoint returned ~59). This build shows **real counts computed from the actually-available questions**, so numbers are self-consistent and will differ from the reference's advertised figures.

## Data gaps (collected by the owner, never fabricated)

- **Answer keys**: the reference API never exposes correct answers; grading is server-side only. Until `scripts/collect-answers.console.js` is run, questions are flagged "answer key not yet verified" and grading reports that honestly instead of guessing.
- **Library PDFs**: the 9 published library resources are downloaded by `scripts/collect-resources.console.js`. Until then, `/library/content` shows an empty state and document views are unavailable — nothing is faked.
- **Full mock-paper question sets**: the reference gated full-paper content behind sign-in and did not expose the per-question sets via a public endpoint, so they were not collected. Paper pages show real metadata (title, totals, difficulty split, subject breakdown) and a sign-in gate for the full paper, matching the reference's own gating.
- **Premium-only surfaces**: the topic heatmap and unlimited doubts are premium-gated (402 on the reference for a free account). Behavior for a premium account could not be fully observed on the owner's free account; the reconstruction implements a reasonable premium view.

## Approximations

- **Virtual library "world"**: the original is a top-down 2D multiplayer scene. This build implements a faithful 2D canvas with WASD movement, zones (reading/quiet/group/discussion), and live presence via the same polling model. Exact art, collision and furniture layout are an approximation, not a pixel copy.
- **Realtime transport**: presence and chat use HTTP polling, matching the reference (which polls rather than using websockets). Library presence is kept in process memory, so a single long-running server instance is needed for consistent cross-user presence (see `deploy.yml` note).
- **Rank predictor**: the true GATE score→rank mapping is published only post-results. The estimate here is derived transparently from historical qualifying statistics and is labelled an estimate; the original's exact internal formula is not published.

## Not implemented (out of scope / not observed as functional)

- **Payments / subscription purchase flow**: UI gates reference Premium, but no payment processor is wired (the original's checkout was not exercised). Upgrade prompts link to informational gates.
- **Global study chat** (premium): not built; premium chat was not observable on a free account.
