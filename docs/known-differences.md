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

- **Official GATE CS papers (`/papers`)**: 32 official papers, 2007–2026, from the owner's folder of official PDFs. Only **9** have their official answer key printed in the PDF (2012 code A, 2014 sessions 1–3, 2016 sets 1–2, 2017 set 2, 2018, 2020); those are gradeable. The other 23 are served as "paper only" until their official keys are added (`data/papers/official/README.md`). 2007–2011, 2019 and 2021 are scanned images. 2021's file holds both sets and isn't split. The organising institute is shown only where the paper prints it.

- **Answer keys**: the reference API never exposes correct answers; grading is server-side only. **The reference's grading endpoint (`POST /api/pyq/attempts`) is currently returning HTTP 500 ("Failed to update attempt")**, so the owner-run `collect-answers.console.js` cannot derive keys until the upstream endpoint recovers (it worked during the initial audit). Until then, questions are flagged "answer key not yet verified" and grading reports that honestly instead of guessing. Re-run the collector when the upstream endpoint is healthy.
- **Library PDFs**: downloaded by `scripts/collect-resources.console.js`. 5 of the 9 published resources (the PDF analyses for EE/ECE/DA/CSE/CE) collected and seeded; the other 4 were Markdown notes whose upstream `/pdf` route failed and are omitted. `/library/content` shows the 5 real PDFs.
- **Official answer keys**: `npm run keys:import` applies keys transcribed from the organising IIT's official answer-key PDFs (CSV files in `data/pyq/official-keys/`, format in `scripts/import-answer-keys.ts`) to `data/pyq/answers.json`. It only applies a key when exactly one collected question matches. 239 of the 559 collected questions share branch/year/session/number with another one (every question is labelled session "1", including papers that ran in two sessions), so those need the `questionId` column.
- **Quality of the collected PYQ bank**: many collected "PYQs" are short one-line items (e.g. "TLB stands for:", "Kruskal uses:") filed under subjects they don't belong to (CS trivia under General Aptitude), and some appear twice with reworded text (e.g. `gate-cs-2024-2` and `gate-cs-2024-1-2`). They do not read like official GATE paper questions. Replacing the bank with the official question papers is the recommended fix.
- **2025 questions in `data/pyq/questions-XX.json`**: collected but not seeded. Their maths symbols were stripped during collection (e.g. "1() = mod 11") and they carry the branch code as the subject name, so they would render broken and be unreachable from the subject picker.
- **Full mock-paper question sets**: the reference gated full-paper content behind sign-in and did not expose the per-question sets via a public endpoint, so they were not collected. Paper pages show real metadata (title, totals, difficulty split, subject breakdown) and say plainly that a full attempt isn't available yet, linking to the branch's PYQs instead of a sign-in gate that led nowhere.
- **Data Science & AI (DA)**: listed as a branch (it is a GATE paper and many CS candidates also take it), but no DA questions, papers or cutoffs were collected; its pages say so.
- **Textile (TF)**: from GATE 2027 TF is section XE9 of the XE paper. The past TF questions stay under TF with a note explaining the change.
- **Premium-only surfaces**: the topic heatmap and unlimited doubts are premium-gated (402 on the reference for a free account). Behavior for a premium account could not be fully observed on the owner's free account; the reconstruction implements a reasonable premium view.

## Approximations

- **Virtual library "world"**: the original is a top-down 2D multiplayer scene. This build implements a faithful 2D canvas with WASD movement, zones (reading/quiet/group/discussion), and live presence via the same polling model. Exact art, collision and furniture layout are an approximation, not a pixel copy.
- **Realtime transport**: presence and chat use HTTP polling, matching the reference (which polls rather than using websockets). Library presence is kept in process memory, so a single long-running server instance is needed for consistent cross-user presence (see `deploy.yml` note).
- **Rank predictor**: the true GATE score→rank mapping is published only post-results. The estimate here is derived transparently from historical qualifying statistics and is labelled an estimate; the original's exact internal formula is not published.

## Not implemented (out of scope / not observed as functional)

- **Payments / subscription purchase flow**: UI gates reference Premium, but no payment processor is wired (the original's checkout was not exercised). Upgrade prompts link to informational gates.
- **Global study chat** (premium): not built; premium chat was not observable on a free account.
