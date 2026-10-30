/**
 * Shared key-value store for state that must be seen by every server
 * instance: rate-limit counters and live library presence.
 *
 * On serverless hosts (Netlify) each request may run on a different instance,
 * so process memory is not shared. When UPSTASH_REDIS_REST_URL/TOKEN are set,
 * commands go to Upstash Redis over its REST API. Without them (local dev, a
 * single long-running server) callers fall back to their in-memory path.
 */

type Command = Array<string | number>;

export function isKvConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/** Run commands in one round trip. Throws if the store is unreachable. */
export async function kvPipeline(commands: Command[]): Promise<unknown[]> {
  const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(3_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash error: ${res.status}`);
  const out = (await res.json()) as Array<{ result?: unknown; error?: string }>;
  return out.map((r) => {
    if (r.error) throw new Error(`Upstash command error: ${r.error}`);
    return r.result;
  });
}
