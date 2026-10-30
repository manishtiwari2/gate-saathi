# Deploying GATE Saathi (free: Netlify live, Render backup, Supabase, Upstash)

| Piece | Service | Notes |
|---|---|---|
| Next.js app (live) | **Netlify** (free) | `netlify.toml`. Functions run in US East (Ohio). |
| Next.js app (backup) | **Render** (free), Ohio | `render.yaml`. Same app, same database; take over by switching DNS. |
| Database | **Supabase** Postgres, **US East (Ohio)** | Next to both hosts. Prisma; row-level security on every table. |
| Sign-in | **Supabase Auth**: Google and GitHub | The app keeps its own `User` table, matched by verified email. |
| User uploads | **Supabase Storage**, private bucket | Browser uploads straight to Storage with a signed URL; downloads redirect to a 60-second signed URL. |
| Rate limits + library presence | **Upstash Redis** | Required in production: serverless instances don't share memory. |
| Library PDFs, past papers | Shipped with the app | `storage/library/`, `public/papers/cs/`. |

The only cost is a custom domain. Everything runs in **US East (Ohio)**:
Netlify's Free plan always runs functions there (changing the region needs
Pro), so the database, Redis and the Render backup sit next to it. Users in
India pay one ocean crossing per request instead of several.

## Secrets: what goes where

| Variable | Secret? | Used by |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No: built into the browser bundle by design | Sign-in |
| `SUPABASE_SECRET_KEY` | **Yes. Server only. Never prefix with `NEXT_PUBLIC_`.** | Storage (signed URLs) |
| `DATABASE_URL`, `DIRECT_URL` | **Yes** | Prisma |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | **Yes** | Rate limits, presence |
| `ANTHROPIC_API_KEY` | **Yes** (optional) | AI tutor |

Never set `ENABLE_DEV_LOGIN` in production (it is ignored there anyway).

## 1. Supabase

1. Create a project at supabase.com in **East US (Ohio), `us-east-2`**, the
   region where Netlify Free runs functions. A database in Mumbai would add
   several India↔US round trips to every request.
2. **Database URLs** (Connect → ORMs → Prisma):
   - `DATABASE_URL`: **transaction pooler**, port 6543, ending
     `?pgbouncer=true&connection_limit=1`
   - `DIRECT_URL`: **session pooler**, port 5432
3. **Lock down the Data API.** Every table gets row-level security from the
   migrations, which already blocks the public API. As a second layer, in
   Project Settings → Data API, remove `public` from *Exposed schemas* (the app
   never uses the Data API).
4. **Storage:** Storage → New bucket → name `user-files`, **Private**, file size
   limit **20 MB**.
5. **Auth providers** (Authentication → Sign In / Providers):
   - **Google:** create an OAuth client in Google Cloud Console → Credentials
     (*Web application*). Authorised redirect URI:
     `https://<project-ref>.supabase.co/auth/v1/callback`. Paste the client ID
     and secret into Supabase.
   - **GitHub:** GitHub → Settings → Developer settings → OAuth Apps → New.
     Callback URL: the same `https://<project-ref>.supabase.co/auth/v1/callback`.
     Paste the client ID and secret into Supabase.
6. **Auth URLs** (Authentication → URL Configuration):
   - Site URL: `https://yourdomain.com` (or the `*.netlify.app` URL at first)
   - Redirect URLs (add all now, so sign-in works on both hosts at any time):
     `https://yourdomain.com/auth/callback`, `https://*.netlify.app/auth/callback`,
     `https://<render-service>.onrender.com/auth/callback`,
     `http://localhost:3000/auth/callback`
7. From Project Settings → **API Keys**, copy the **publishable key**
   (`sb_publishable_...`) and a **secret key** (`sb_secret_...`); the Project URL
   is on the same settings area.

## 2. Upstash

Create a free Redis database in **US East (`us-east-1` or `us-east-2`)** and copy
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from its REST API section.

## 3. Create the tables and load the data (from your machine)

```bash
DATABASE_URL="<transaction pooler url>" DIRECT_URL="<session pooler url>" npx prisma migrate deploy
```

```bash
DATABASE_URL="<transaction pooler url>" DIRECT_URL="<session pooler url>" npm run db:seed
```

Re-run the seed whenever `data/` changes. It keeps users' attempt history.

## 4. Netlify (the live site)

1. Sign in at netlify.com with GitHub → **Add new site → Import an existing
   project** → pick `gate-saathi`. Netlify reads `netlify.toml`
   (`npm run build:deploy`, which runs `prisma migrate deploy` then `next build`)
   and adds its Next.js runtime automatically.
2. Site configuration → **Environment variables**: add everything in the table
   above. Scope the database variables to the **Production** context only, or a
   deploy preview of a pull request with a migration would migrate production.
3. Leave **Functions → Region** at its default, US East (Ohio). On the Free
   plan it can't be changed; that's why Supabase is in Ohio too.
4. Deploy. Every push to `main` deploys to production, and **each production
   deploy costs 15 of the 300 monthly credits** (see the budget below).
   Merge to `main` in batches; deploy previews of pull requests are free.

### Custom domain

Buy the domain (Cloudflare Registrar charges cost price for `.com`), add it in
Netlify → Domain management, create the DNS records Netlify shows, then update
the Supabase Site URL and redirect URLs to the new domain.

## 5. Render (the backup)

Render runs the same app from the same repository, database and Redis, so it
is always ready to take over.

1. On render.com → **New → Blueprint** → pick `gate-saathi`. It reads
   `render.yaml` (free web service, Ohio, auto-deploys from `main`).
2. Add the same environment variables as on Netlify (the secret ones are
   listed in `render.yaml` with `sync: false`).
3. Add your custom domain in Render → Settings → **Custom Domains** now, so
   its certificate is ready before you ever need it. Don't point DNS at it yet.

Both hosts run `prisma migrate deploy` when they build. That is safe: Prisma
locks the database while migrating, and a migration that already ran is skipped.

Render's free services **sleep after about 15 minutes idle** (the next visit
takes ~30-60 s to wake). That's acceptable for a backup.

### Switching to the backup

Switch when Netlify pauses the site (credits used up) or is down.

1. Open the Render URL (`*.onrender.com`) once to wake it, and check that it works.
2. At your DNS provider, point the domain's record at Render instead of Netlify
   (Render shows the exact record under Custom Domains). Changes usually take
   a few minutes.
3. Nothing else changes: same database, same sign-in, same uploads.

Switch back the same way once Netlify is available again (for example, when
the next month's credits arrive).

## Netlify Free budget

Netlify Free gives **300 credits a month with a hard limit**. When they run
out, **every site on the team is paused** ("Site not available") until the
next billing cycle. That's what the Render backup is for. Rates at the time of
writing (check Netlify's pricing docs for changes):

| What | Credits |
|---|---|
| Production deploy | 15 each (deploy previews and failed deploys are free) |
| Function compute | 10 per GB-hour (1 GB functions, so 10 per hour of running time) |
| Web requests | 2 per 10,000 |
| Bandwidth | 20 per GB |

Polling is the biggest cost: room chat every 4 s, member list every 5 s (30 s
heartbeat), library world every 3 s while the tab is visible. One student in a
study room makes about 1,700 requests an hour. Watch **Usage & billing** on
Netlify weekly, and switch to the backup (or move to Netlify Personal, which
can buy more credits instead of pausing) before the balance hits zero.

Other Netlify function limits that matter here: 60 s per request (fine for the
AI tutor) and 6 MB per request/response body (uploads go straight to Supabase,
so they never hit it).

Netlify Free only deploys commits from collaborators on **public**
repositories. If the repository becomes private, contributors' commits stop
deploying.

## Checking a deployment

- `/` shows the GATE 2027 countdown; `/pyqs/cs` lists questions (seed ran).
- `/login` shows Google and GitHub; signing in returns to the page you came from.
- `/rooms`: create a room, send a chat message.
- `/storage`: upload a PDF, open it, delete it.
