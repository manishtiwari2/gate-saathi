# PadhaiShuru — Website Audit

Audited 2026-10-24 against https://www.padhaishuru.com (the `/l` URL in the brief is a 404; root is the live site). Method: Playwright browser at desktop (1440×900) and mobile (390×844), DOM text dumps saved under `docs/audit-raw/`, plus request logging while driving each page. Logged-in pages audited with the owner's own account (free plan).

This reconstruction is authorized by the site owner.

## Technology of the original

- Next.js (App Router, Turbopack). Marketing pages server-render; app pages render on the client after a profile fetch.
- Tailwind CSS with CSS custom properties for theming; dark mode via a `dark` class on `<html>`.
- Fonts: Inter (body/UI) and Playfair Display (display headings), served through `next/font`.
- Backend is Supabase (auth + Postgres) fronted by Next.js route handlers under `/api`.
- Live presence/chat use periodic HTTP polling, not websockets. The library "world" posts position updates roughly 3×/second; room chat re-fetches messages every ~2 seconds.
- First-party analytics script served from a hashed path.

## Design tokens

Light theme (`:root`):

| Token | Value | Token | Value |
|---|---|---|---|
| background | #faf8f5 | accent | #b8710e |
| background-alt | #f2ede6 | accent-hover | #9a5e0a |
| background-dark | #1a1a1a | accent-subtle | #fdf3e4 |
| foreground | #1a1a1a | border | #e8e2da |
| muted | #6b6560 | error | #c43e3e |
| muted-light | #a89f97 | success | #2d7a4f |

Dark theme (`.dark`): background #1A1A1A, background-alt #252525, background-dark #0F0F0F, foreground #FAF8F5, muted #A89F97, muted-light #6B6560, accent #D4891A, accent-hover #B8710E, accent-subtle rgba(212,137,26,.08), border #333333, error #E05555, success #3DA06A.

Typography:

- Body: Inter 16/24, weight 400.
- H1: Playfair Display 60/64.8, weight 400, letter-spacing −1.5px.
- H2: Playfair Display 48/52.8, weight 400, letter-spacing −1.2px.
- H3: Inter 18/28, weight 600.
- Eyebrow/kicker above section headings: monospace 12px, letter-spacing 2.4px, uppercase, accent color.
- Nav links: Inter 14px, muted color. Cards: 16px radius, 1px `border` border. Nav bar: 90%-opacity background with backdrop blur.

## Data layer the reconstruction needs to mirror

The front end reads from route handlers under `/api`. The ones relevant to a faithful rebuild, grouped by feature:

- **Account**: current-user profile (display name, username, avatar, daily goal, timezone, plan, premium flag).
- **PYQ library**: branch list (20 branches, years 2021–2025, per-branch counts); subjects-and-topics per branch; a paginated question list filterable by branch/subject; a per-question detail record; answer checking is server-side (grading returns only correct/incorrect, never the key).
- **Mock papers**: branch list with paper counts; per-branch paper metadata (title, totals, difficulty split, subject breakdown). Full paper content requires sign-in.
- **Cutoffs**: historical cutoff rows by year and branch (120 rows observed).
- **Study**: study-session list and aggregated stats (streak, today minutes, goal progress).
- **Rooms**: list/create rooms; per-room members, messages, files.
- **Library**: published content resources; a per-document PDF stream; a multiplayer position channel.
- **Dashboard extras**: progress card, leaderboard, plus benchmark/reminders (see defects below).

Question detail records carry: branch/subject/topic names and ids, year, session, question number, type (MCQ/MSQ/NAT), marks, negative marks, difficulty, options, tags, and verification metadata — but no correct answer.

## Behaviour verified by driving the UI

- **Theme toggle** switches `.dark` and persists.
- **Mobile nav**: hamburger opens a full menu.
- **PYQ browse**: selecting a branch loads subjects; selecting a subject loads that subject's questions in browse/quiz mode.
- **Rooms**: created a room (got a 6-char room key), opened it, switched Focus/Chat/Members/Files tabs, sent a chat message (persisted), ran a focus timer (Start → counts up → End shows elapsed), and left the room (confirm dialog). Timer counts client-side; the session-write request was not captured in the network log and is noted as uncertain.
- **Library world**: loads a top-down 2D canvas scene ("WASD Move · Enter Chat"), with Start Studying, Music, mic, and a Resources panel listing 9 published files. Opening a resource routes to a document viewer that embeds the PDF stream.
- **Answer grading**: submitting a chosen option returns only whether it was correct.

## Accessibility / responsiveness notes

- Landmarks present (nav, main, contentinfo). Headings are ordered.
- Layouts reflow cleanly at 390px; nav collapses to a toggle.
- Dark mode has its own token set (not just inverted).

## Known defects in the original (reproduce as-is, document, do not invent replacements)

- Nav "Daily PYQ" links to `/daily`, which returns 404.
- Footer/nav "Invite friends" links to `/referral`, which returns 404.
- On the dashboard, the benchmark and reminders endpoints return HTTP 500.
- Topic heatmap is premium-gated: its data endpoint returns HTTP 402 for a free account.
- Per-branch and per-subject question counts are inconsistent with each other and with the number of questions the list endpoint actually returns (e.g. CS advertises 487, subjects sum to 846, the list returns ~59 unique). Treated as upstream data inconsistency.

## Uncertainties / inaccessible

- Correct answers are never exposed by the API; they can only be inferred through the grading endpoint.
- Premium-only surfaces (heatmap, full global chat, unlimited doubts) cannot be fully observed on a free account.
- The exact study-session persistence call for the room focus timer was not captured.
- Payment/subscription flow not exercised (no purchase made).
