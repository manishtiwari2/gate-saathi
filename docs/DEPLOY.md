# Deploying GATE Saathi (free: Netlify + Supabase + Upstash)

| Piece | Service | Notes |
|---|---|---|
| Next.js app | **Netlify** (free) — fallback: **Render** (free) | `netlify.toml` / `render.yaml` in the repo. |
| Database | **Supabase** Postgres | Prisma, unchanged. Tables have row-level security on (see below). |
| Sign-in | **Supabase Auth**: Google and GitHub | The app keeps its own `User` table, matched by verified email. |
| User uploads | **Supabase Storage**, private bucket | Browser uploads straight to Storage with a signed URL; downloads redirect to a 60-second signed URL. |
| Rate limits + library presence | **Upstash Redis** | Required in production: serverless instances don't share memory. |
| Library PDFs, past papers | Shipped with the app | `storage/library/`, `public/papers/cs/`. |

The only cost is a custom domain. Free-tier rules change; check each provider's
pricing page (Netlify's free plan is credit-based: deploys, bandwidth and
function time all use credits, and the site pauses when they run out).

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

1. Create a project at supabase.com. Pick the region closest to where the app's
   functions run (see step 4), e.g. **Mumbai (ap-south-1)** or **Singapore**.
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
   - Redirect URLs: `https://yourdomain.com/auth/callback`,
     `https://*.netlify.app/auth/callback`, `http://localhost:3000/auth/callback`
7. From Project Settings → **API Keys**, copy the **publishable key**
   (`sb_publishable_...`) and a **secret key** (`sb_secret_...`); the Project URL
   is on the same settings area.

## 2. Upstash

Create a free Redis database (same region family as the app) and copy
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from its REST API section.

## 3. Create the tables and load the data (from your machine)

```bash
DATABASE_URL="<transaction pooler url>" DIRECT_URL="<session pooler url>" npx prisma migrate deploy
```

```bash
DATABASE_URL="<transaction pooler url>" DIRECT_URL="<session pooler url>" npm run db:seed
```

Re-run the seed whenever `data/` changes. It keeps users' attempt history.

## 4. Netlify (app)

1. Sign in at netlify.com with GitHub → **Add new site → Import an existing
   project** → pick `gate-saathi`. Netlify reads `netlify.toml`
   (`npm run build:deploy`, which runs `prisma migrate deploy` then `next build`)
   and adds its Next.js runtime automatically.
2. Site configuration → **Environment variables**: add everything in the table
   above. Scope the database variables to the **Production** context only, or a
   deploy preview of a pull request with a migration would migrate production.
3. Site configuration → **Functions → Region**: if your plan lets you change
   it, pick the region nearest your Supabase project. If not, create the
   Supabase project in the functions' region instead; a database far from the
   functions makes every page slower.
4. Deploy. Every push to `main` deploys to production.

### Custom domain

Buy the domain (Cloudflare Registrar charges cost price for `.com`), add it in
Netlify → Domain management, create the DNS records Netlify shows, then update
the Supabase Site URL and redirect URLs to the new domain.

## Fallback: Render

If Netlify doesn't work out, create a **Blueprint** on render.com from this
repository; it reads `render.yaml` (free web service, Singapore). Add the same
environment variables in the dashboard. Render's free services **sleep after
about 15 minutes idle** (the next visit takes ~30-60 s to wake) and have no
persistent disk, which is fine because uploads live in Supabase Storage.

## Free-tier budget (approximate)

Polling intervals are sized for free quotas: room chat every 4 s, member list
every 5 s (30 s heartbeat), library world every 3 s and only while the tab is
visible. Each poll is a function call on Netlify, so busy study rooms are the
first thing to watch on the usage page.

## Checking a deployment

- `/` shows the GATE 2027 countdown; `/pyqs/cs` lists questions (seed ran).
- `/login` shows Google and GitHub; signing in returns to the page you came from.
- `/rooms`: create a room, send a chat message.
- `/storage`: upload a PDF, open it, delete it.
