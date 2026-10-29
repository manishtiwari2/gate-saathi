import { fail } from "@/lib/api";

/**
 * Fixed-window rate limiter kept in process memory. Like library presence,
 * this assumes a single long-running Node instance; move it to a shared store
 * (Redis) together with presence before scaling out.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, w] of windows) if (w.resetAt <= now) windows.delete(key);
}

/** Count one hit for `key`. Returns false once `limit` hits land inside `windowMs`. */
export function hit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  sweep(now);
  const w = windows.get(key);
  if (!w || w.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  w.count++;
  return w.count <= limit;
}

/** Best-effort client IP from proxy headers. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Apply a named limit. Returns a 429 response when exceeded, otherwise null.
 * `who` is a user id for signed-in routes, or the client IP.
 */
export function rateLimit(name: string, who: string, limit: number, windowMs: number) {
  if (hit(`${name}:${who}`, limit, windowMs)) return null;
  return fail(429, "RATE_LIMITED", "Too many requests. Please slow down and try again shortly.");
}

/** Test helper. */
export function resetRateLimits() {
  windows.clear();
}
