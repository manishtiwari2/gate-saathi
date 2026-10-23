# Page Inventory

Status legend: **public** = reachable logged-out; **auth** = needs sign-in; **404** = broken on the original (reproduce as a known defect).

| Route | Title | Status | Rendering | Purpose / key UI |
|---|---|---|---|---|
| `/` | Study for GATE with Friends | public | SSR | Marketing home: hero with example study-room card, 3-step "how it works", feature grid, GATE-tools grid, mock-paper branch grid, FAQ accordion, CTA, footer. |
| `/pyqs` | GATE PYQs by branch | public | SSR | Branch picker (20 branches) + branch search box; "practice every question, free" section. |
| `/pyqs/{branch}` | GATE {BRANCH} PYQs | public | client | Subject list with per-subject/topic counts; selecting a subject loads questions in browse/quiz mode. Query form `?subject=`. |
| `/predicted-papers` | GATE 2027 Mock Tests | public | SSR | Intro + branch grid linking to per-branch papers. |
| `/predicted-papers/{branch}` | GATE 2027 {BRANCH} Mock Tests | public | client | 4 trend-based papers per branch (title, totals, difficulty split, subject breakdown). Preview free; full paper needs sign-in. |
| `/doubts` | AI Doubt Solver | public→auth | client | AI doubt engine; 5/day free, unlimited premium. Question input + branch/subject context. |
| `/predictor` | GATE Rank Predictor | public | client | Marks + branch inputs → estimated AIR. Client-side calc. |
| `/cutoffs` | GATE Cutoff Marks | public | client | Historical cutoff table by year/branch/category. |
| `/library` | Virtual Library | public | SSR | Landing: reading area / quiet zone / group tables; links into world, main room, content. |
| `/library/world` | Virtual Library (world) | auth | client canvas | Top-down 2D multiplayer scene. WASD move, Enter chat, focus/study, music, mic, Resources panel (published files). |
| `/library/room/main-library` | Library room | auth | client canvas | Named multiplayer room inside the world. |
| `/library/content` | Library Content | auth | client | Content listing/planner. |
| `/library/document/{id}` | Document viewer | auth | client | Embedded PDF viewer for a published resource. |
| `/rooms` | Study Rooms | auth | client | List of my rooms; Join Room (room key) / Create Room (name + description). Empty state. |
| `/rooms/{id}` | Study Room | auth | client | Room: header with room key + copy invite / WhatsApp share / share files / leave; tabs Focus, Chat, Members, Files. Focus timer (start/pause/end). |
| `/dashboard` | Dashboard | auth | client | Streak, daily goal progress, today minutes, progress card, benchmark (500 on original), reminders (500 on original). |
| `/leaderboard` | Study Leaderboard | auth | client | Ranking by verified study time; period/scope filters; my rank row. |
| `/heatmap` | Topic Heatmap | auth (premium) | client | Topic mastery heatmap. Premium-gated (402 for free). |
| `/storage` | My Storage | auth | client | Personal file storage; upload; share to room. |
| `/profile` | Profile | auth | client | Display name, username, avatar, daily goal, timezone, plan. |
| `/login` | Log In or Sign Up | public | client | Google sign-in. Redirects to `/dashboard` when already authenticated. |
| `/how-it-works` | How it works | public | SSR | Narrative: the practice loop, AI feedback, gamification. |
| `/syllabus-changes` | GATE 2027 Syllabus Changes | public | SSR | Sourced change checklist with checkboxes; papers without an itemized change. |
| `/privacy` | Privacy Policy | public | SSR | Full policy (Google sign-in, study data, payments, AI data, chat, storage). |
| `/terms` | Terms of Service | public | SSR | Full terms (free/premium, payments/refunds, acceptable use, IP, AI disclaimer). |
| `/daily` | — | **404** | — | Linked from nav as "Daily PYQ" but not implemented upstream. |
| `/referral` | — | **404** | — | Linked as "Invite friends" but not implemented upstream. |

## GATE branches (codes used in routes and data)

cs, ec, ee, me, ce, in, pi, ch, bt, mt, xe, xl, tf, pe, ey, ma, ar, ag, gg, ph (20). Each has a PYQ page and a mock-papers page.

## Component inventory (to build)

- Layout: `SiteNav` (links, Daily PYQ, Sign In / user menu, theme toggle, mobile toggle), `SiteFooter` (Platform / Legal / Support columns), `ThemeProvider`.
- Primitives: `Button` (primary/secondary/ghost), `Card` (16px radius), `Input`, `Select`, `Textarea`, `Badge`, `Accordion`, `Dialog`, `Tabs`, `Avatar`, `EmptyState`, `Kicker` (mono eyebrow), `DisplayHeading` (Playfair).
- Home sections: `Hero` + `ExampleRoomCard`, `HowItWorks`, `FeatureGrid`, `GateToolsGrid` + `DoubtDemo`, `MockPaperBranchGrid`, `Faq`, `CtaBand`.
- PYQ: `BranchGrid`, `BranchSearch`, `SubjectList`, `QuestionBrowser`, `QuizMode`.
- Papers: `PaperBranchGrid`, `PaperList`, `PaperCard`.
- Rooms: `RoomList`, `CreateRoomDialog`, `JoinRoomDialog`, `RoomHeader`, `FocusTimer`, `RoomChat`, `MemberList`, `RoomFiles`.
- Library: `LibraryLanding`, `WorldCanvas`, `ResourcesPanel`, `DocumentViewer`.
- Account: `Dashboard` widgets (`StreakCard`, `GoalCard`, `ProgressCard`), `Leaderboard`, `Heatmap`, `StorageManager`, `ProfileForm`.
- Tools: `Predictor`, `CutoffTable`.
