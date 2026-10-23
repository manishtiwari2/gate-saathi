# Match Report — GATE Saathi vs PadhaiShuru reference

Written for: the project owner, to judge how closely the reconstruction matches the live reference and what is fully functional.

Compared against https://www.padhaishuru.com as audited 2026-10-24. Reconstruction rebranded to **GATE Saathi**.

## Route coverage: 24 / 24 reference routes (100%)

Every publicly linked route from the reference is implemented, plus the authenticated sub-routes. The two reference routes that 404 on the original (`/daily`, `/referral`) are reproduced as 404s on purpose (documented as reference defects).

| Reference route | Built | Functional status |
|---|---|---|
| `/` | ✅ | Full — all sections reproduced |
| `/pyqs` | ✅ | Full — branch grid + live search, real data |
| `/pyqs/[branch]` | ✅ | Full — subjects, browse + quiz, real grading |
| `/predicted-papers` | ✅ | Full — branch index from real paper metadata |
| `/predicted-papers/[branch]` | ✅ | Full — paper cards (difficulty/subject breakdown); full-paper practice gated to sign-in (matches reference) |
| `/doubts` | ✅ | Functional — real Anthropic when key set; clean "coming soon" when not (per your instruction) |
| `/predictor` | ✅ | Full — real estimate from historical qualifying stats |
| `/cutoffs` | ✅ | Full — real cutoff data, year/branch filters |
| `/library` | ✅ | Full — landing with zones + CTAs |
| `/library/world` | ✅ | Functional — 2D canvas, WASD movement, live presence via polling |
| `/library/content` | ✅ | Full — lists published resources (empty until PDFs collected) |
| `/library/document/[id]` | ✅ | Full — embedded viewer, premium-gated, safe serving |
| `/library/room/[room]` | ✅ | Redirects into the world (reference parity) |
| `/rooms` | ✅ | Full — list, create, join by key |
| `/rooms/[id]` | ✅ | Full — focus timer (records real sessions), chat, members, files |
| `/dashboard` | ✅ | Full — streak, goal, totals, 30-day chart from real data |
| `/leaderboard` | ✅ | Full — ranked by real verified study time |
| `/heatmap` | ✅ | Full — premium-gated upsell for free; real heatmap for premium |
| `/storage` | ✅ | Full — upload/list/download/delete, real files on disk |
| `/profile` | ✅ | Full — editable profile |
| `/login` | ✅ | Full — Google (when configured) + dev login |
| `/how-it-works` | ✅ | Full — reproduced |
| `/syllabus-changes` | ✅ | Full — real sourced GATE 2027 checklist with on-device ticks |
| `/privacy`, `/terms` | ✅ | Full — reference legal text, rebranded |

## Functional coverage by feature

| Feature | Reference | Reconstruction | Match |
|---|---|---|---|
| Visual design (layout, type, color, dark mode) | — | Tokens extracted from the live site; Inter + Playfair; light/dark | High |
| PYQ library + quiz | server-graded | Same model; real seeded data; honest "unverified" where no key yet | High |
| Answer keys | server-only | Derived via owner-run collector (pending run) | Pending your script run |
| Mock papers | metadata + gated full paper | Metadata real; full paper gated to sign-in | High (full-paper question sets were auth-gated upstream, not collected) |
| Rank predictor | marks → AIR | Real estimate from historical qualifying stats | Functional (method differs; documented) |
| Cutoffs | historical table | Real data, filters | High |
| Study rooms (timer/chat/members/files) | polling | Same polling model; real persistence | High |
| Virtual library world | 2D multiplayer canvas | 2D canvas, WASD, polling presence | Functional (approximation of the original scene) |
| Dashboard / streaks / leaderboard / heatmap | real | Real, computed from study sessions | High |
| AI doubt engine | live AI, 5/day free | Real Anthropic + 5/day limit; coming-soon without a key | Full when key set |
| Auth | Google (Supabase) | Google (Auth.js) + dev fallback | High |
| Storage | per-user files | Real local-disk files + metadata | High |

## Overall

- **Structure / navigation / visual match: high across all pages.**
- **Functionally complete and runnable end-to-end** with zero external keys (dev login, offline-safe AI). With Google + Anthropic keys and the owner-run data collectors, it reaches full parity on answer keys and live AI.
- No fabricated content: all questions, papers, cutoffs and syllabus items are real data collected from the reference. Gaps (answer keys, library PDFs) are collected by the owner's own scripts, never invented.

See `docs/known-differences.md` for the itemized differences.
