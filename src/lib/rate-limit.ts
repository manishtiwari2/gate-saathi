import { fail } from "@/lib/api";
import { isKvConfigured, kvPipeline } from "@/lib/kv";

/**
 * Fixed-window rate limiter. Counters live in Upstash Redis when it is
 * configured (needed on Netlify, where instances don't share memory) and in
 * process memory otherwise (local dev, a single long-running server).
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

/** Same as `hit`, against the shared store. Two commands per call. */
async function hitShared(key: string, limit: number, windowMs: number): Promise<boolean> {
  // SET NX starts a window with its expiry; INCR counts this request in it.
  const [, count] = await kvPipeline([
    ["SET", `rl:${key}`, 0, "PX", windowMs, "NX"],
    ["INCR", `rl:${key}`],
  ]);
  return Number(count) <= limit;
}

/**
 * Apply a named limit. Resolves to a 429 response when exceeded, otherwise
 * null. `who` is a user id for signed-in routes, or the client IP.
 */
export async function rateLimit(name: string, who: string, limit: number, windowMs: number) {
  const key = `${name}:${who}`;
  let allowed: boolean;
  if (isKvConfigured()) {
    try {
      allowed = await hitShared(key, limit, windowMs);
    } catch (e) {
      // If the store is down, fall back to this instance's memory rather than
      // failing every request.
      console.error("Rate limit store unavailable", e);
      allowed = hit(key, limit, windowMs);
    }
  } else {
    allowed = hit(key, limit, windowMs);
  }
  if (allowed) return null;
  return fail(429, "RATE_LIMITED", "Too many requests. Please slow down and try again shortly.");
}

/** Test helper. */
export function resetRateLimits() {
  windows.clear();
}
