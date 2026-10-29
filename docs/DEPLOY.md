# Deploying GATE Saathi (free: Vercel + Neon + Upstash)

GATE Saathi runs on free tiers: the app on **Vercel Hobby**, the database on
**Neon** (Postgres), and shared live state (rate limits, library presence) on
**Upstash Redis**. The only cost is a custom domain if you want one.

> **Vercel Hobby is for non-commercial use.** That's fine while GATE Saathi is
> free. Before charging for Premium, move to Vercel Pro or another host.

Free-tier limits change; check each provider's pricing page.

## What runs where

| Piece | Service | Notes |
|---|---|---|
| Next.js app | Vercel (region `sin1`, Singapore — set in `vercel.json`) | Deploys automatically from GitHub. |
| Database | Neon Postgres, **AWS Singapore** region | Keep it next to the app. Scales to zero when idle. |
| Rate limits + library presence | Upstash Redis | Optional but recommended on Vercel; without it each server instance keeps its own counters. |
| Library PDFs | Bundled with the app from `storage/library/` | Served by `/api/library/document/[id]`. |
| User uploads | Off on Vercel (shows "coming soon") | Serverless functions have no persistent disk. Needs object storage later. |

## One-time setup

### 1. Neon (database)

1. Create a free account at neon.tech and a project in **AWS Asia Pacific (Singapore)**.
2. From the project's **Connect** dialog copy two connection strings:
   - the **pooled** one (host contains `-pooler`) → `DATABASE_URL`
   - the **direct** one (no `-pooler`) → `DIRECT_URL`

   Both need `?sslmode=require`.

### 2. Upstash (shared state)

1. Create a free account at upstash.com and a **Redis** database in a Singapore
   (`ap-southeast-1`) region.
2. From its **REST API** section copy `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN`.

### 3. Create the tables and load the data (from your machine)

Run once, with the Neon strings pointing at production:

```bash
DATABASE_URL="<neon pooled url>" DIRECT_URL="<neon direct url>" npx prisma migrate deploy
```

```bash
DATABASE_URL="<neon pooled url>" DIRECT_URL="<neon direct url>" npm run db:seed
```

Re-run the seed whenever `data/` changes (for example after importing answer
keys). It keeps users' attempt history.

### 4. Vercel (app)

1. Sign in at vercel.com with GitHub and **Import** the `gate-saathi` repository.
   Framework is detected as Next.js; leave build settings as they are
   (`package.json` has a `vercel-build` script that runs
   `prisma migrate deploy` before `next build`).
2. Add these **Environment Variables** (Production):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon pooled URL |
   | `DIRECT_URL` | Neon direct URL |
   | `NEXTAUTH_SECRET` | output of `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `https://<your-domain>` (or the `*.vercel.app` URL at first) |
   | `UPSTASH_REDIS_REST_URL` | from Upstash |
   | `UPSTASH_REDIS_REST_TOKEN` | from Upstash |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | for sign-in (step 6) |
   | `ANTHROPIC_API_KEY` | optional; the AI tutor shows "coming soon" without it |

   Do **not** set `ENABLE_DEV_LOGIN`. Dev login is disabled in production builds anyway.

3. Deploy. Every merge to `main` deploys to production; pull requests get
   preview deployments.

> **Preview deployments and the database.** `vercel-build` runs
> `prisma migrate deploy`. If preview deployments share the production
> `DATABASE_URL`, a pull request with a new migration would apply it to
> production. Either set the database variables for **Production only**, or
> install Neon's Vercel integration, which gives each preview its own database
> branch.

### 5. Custom domain

1. Buy the domain (for example at Cloudflare Registrar, which charges cost
   price for `.com`).
2. In Vercel → Project → **Settings → Domains**, add `yourdomain.com` and
   `www.yourdomain.com`. Vercel shows the DNS records to create.
3. Create those records at your DNS provider. If you use Cloudflare DNS, set
   the records to **DNS only** (grey cloud) so Vercel can issue the HTTPS
   certificate.
4. Update `NEXTAUTH_URL` to `https://yourdomain.com` and redeploy.

### 6. Google sign-in

Without it, nobody can sign in on production (dev login is off there).

1. Google Cloud Console → APIs & Services → **Credentials** → Create
   **OAuth client ID** → *Web application*.
2. Authorised redirect URI: `https://yourdomain.com/api/auth/callback/google`
   (and the `*.vercel.app` one if you use it).
3. Put the client ID and secret in Vercel and redeploy.

## Free-tier budget (approximate)

Polling intervals are set to fit free quotas:

- **Room chat** polls every 4 s, **member list** every 5 s, room heartbeat every 30 s.
- **Library world** syncs every 3 s, and only while the tab is visible:
  about 1 Redis command per tick when standing still and 3 when moving.
  Upstash's free 500K commands/month is a few hundred hours of
  library-world use per month.
- **Neon** scales to zero when nobody is using the site; the first request
  after a quiet spell takes a moment longer.

If the site grows past these, the first upgrades are Upstash pay-as-you-go
and Neon's paid plan; the code doesn't change.

## Checking a deployment

- `/` shows the GATE 2027 countdown.
- `/pyqs/cs` lists questions (seed ran).
- `/cutoffs` shows the table (it refreshes hourly from the database).
- Sign in with Google, open `/rooms`, create a room, send a chat message.
- `/storage` shows "File uploads are coming soon".
