# Product Specification

What GATE Saathi is and how it is supposed to behave. This is the behavior contract; the implementation status of each feature lives in [FEATURES.md](FEATURES.md), and the technical design in [ARCHITECTURE.md](ARCHITECTURE.md).

## Vision

A GATE exam-prep platform where students prepare **together** rather than alone: shared study rooms with focus timers and chat, a virtual library, leaderboards, and streaks, layered on top of a real question bank, trend-based mock papers, an AI doubt engine, a rank predictor, and historical cutoffs.

GATE Saathi is an authorized reconstruction of `https://www.padhaishuru.com`. The goal is parity with the reference in appearance, structure, navigation, and functionality, built entirely on real collected data.

## Principles

1. **Real data only.** No fabricated questions, answers, cutoffs, or resources. Gaps are shown honestly, not filled with invented values.
2. **Graceful degradation over failure.** A feature that needs an unconfigured external key shows a "coming soon" state, never an error or a fake result.
3. **Reference fidelity.** Reproduce the reference's layout and behavior, including its known defects, documented as such.
4. **Honest grading.** A question without a verified answer key is graded transparently ("answer key not yet verified") rather than guessed.

## Users and access tiers

- **Anonymous** — can browse public content (PYQ listings, paper metadata, cutoffs, marketing pages). Full papers and personalized features require sign-in.
- **Free (signed-in)** — study rooms, PYQ quiz/browse, dashboard, streaks, leaderboard, limited AI doubts (reference: 5/day), free library resources.
- **Premium** — unlimited doubts, topic heatmap, premium library content, and (intended) global study chat. Entitlement is modeled as `User.plan` (`free` | `premium`), with `isPremium` derived. The billing half is not yet built (see [FEATURES.md](FEATURES.md) and issue #9).

## Scope — the 20 GATE branches

`cs, ec, ee, me, ce, in, pi, ch, bt, mt, xe, xl, tf, pe, ey, ma, ar, ag, gg, ph` — with their display names and icons defined in `src/lib/branches.ts`.

## Functional requirements by domain

### Previous-year questions (PYQ)
- Browse branches → subjects → topics; both a browse mode and a timed quiz mode.
- Per-branch/subject counts reflect the questions actually available, so totals are self-consistent (this intentionally differs from the reference's internally inconsistent advertised counts).
- Attempts are recorded per user. Grading uses a verified answer key when one exists; otherwise it is reported as unverified.

### Mock papers
- Trend-based predicted papers, several per branch, with real metadata (title, totals, difficulty split, subject breakdown).
- Full per-question paper sets were auth-gated upstream and could not be collected; paper pages show metadata plus a sign-in gate, matching the reference's own gating.

### AI doubt engine
- A student asks a question (optionally scoped to branch/subject) and receives an answer from the Anthropic Messages API.
- Free tier is rate-limited (reference: 5/day); premium is unlimited.
- When `ANTHROPIC_API_KEY` is absent, the page shows a coming-soon state and never fabricates an answer.

### Rank predictor
- Estimates rank from a GATE score using historical qualifying statistics, transparently labelled an estimate. The true score→rank mapping is published only post-results, so this is a model, not the official formula.

### Cutoffs
- Historical qualifying cutoffs per branch/year/category, plus applicant/qualified totals and qualifying rate. Real collected data.

### Study rooms
- Create or join a private room by key; focus timer; chat; member presence; shared files.
- Chat and presence use HTTP polling. Room membership is authorization-checked on every room API call.

### Virtual library
- A top-down 2D canvas "world" with WASD movement and zones (reading / quiet / group / discussion) and live presence, plus a `/library/content` resource list serving real collected PDFs. The art and collision layout are a faithful approximation, not a pixel copy.

### Dashboard, streaks, leaderboard, heatmap
- Dashboard shows study activity, daily goal, and streak. Leaderboard ranks by verified study time. The topic heatmap is premium-gated.

### Storage
- Per-user file storage with metadata, quotas (intended), and per-file visibility (`private` | `published`) and access tier (`free` | `premium`).

### Auth
- Google sign-in (Auth.js / NextAuth, JWT sessions) with a local dev-login fallback so the app runs without Google credentials.

## Non-goals (current)

- A real payment processor / checkout (planned — see issue #9; needs money-handling review before building).
- Global premium study chat (not observable on a free account during audit).
- Pixel-identical reproduction of the virtual-library art.

## Known differences from the reference

Maintained in [docs/known-differences.md](known-differences.md). Any intentional or unavoidable divergence is recorded there, never hidden.
