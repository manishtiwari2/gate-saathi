# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in GATE Saathi, please report it privately. Do **not** open a public GitHub issue for security problems.

- Email the maintainer at **manishtiwari2578@gmail.com** with a description, reproduction steps, and the potential impact.
- Alternatively, open a GitHub [private security advisory](https://docs.github.com/en/code-security/security-advisories) on the repository.

Please allow a reasonable time for a fix before any public disclosure. We will acknowledge your report and keep you informed of the resolution.

## Supported versions

The project is pre-1.0 and under active development. Only the current `main` branch is supported; fixes land there.

## Security invariants

These are enforced in the codebase and must not regress. They are also listed in [CLAUDE.md](../CLAUDE.md) for contributors.

- **Owner-only file access.** `GET /api/user/files/[id]` returns 403 unless the file belongs to the requesting user. Published files are served by a separate endpoint, `GET /api/library/document/[id]`.
- **Premium gating.** Premium content returns 403 for non-premium users (`file.accessTier === "premium" && !user.isPremium`).
- **Safe file responses.** File streams set `X-Content-Type-Options: nosniff` and a sandbox CSP, and render inline only for an allowlist of MIME types.
- **Room authorization.** Room API calls verify membership before returning room data.
- **Input validation.** API route input is validated with zod.
- **No secrets in the repository.** Only `.env.example` is committed; real credentials live in `.env.local` / the deployment environment and are gitignored.

## Handling secrets

Required/optional environment variables are documented in `.env.example`. The app runs locally with none of them (dev login on, AI engine in coming-soon state). For production, set the database URLs, the Supabase keys (the service-role key is server-only, never `NEXT_PUBLIC_`), the Upstash credentials and optionally `ANTHROPIC_API_KEY`; dev login is never honoured in production. All tables have row-level security on, so the Supabase anon key cannot read them through the Data API.
