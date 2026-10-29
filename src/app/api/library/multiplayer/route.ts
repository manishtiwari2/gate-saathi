import { z } from "zod";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { isKvConfigured, kvPipeline } from "@/lib/kv";

/**
 * Presence channel for the virtual library, matching the reference's polling
 * model: POST updates my position and returns the others; GET only lists them.
 *
 * Presence is ephemeral. It lives in Upstash Redis when configured (needed on
 * serverless hosts, where instances don't share memory) and in process memory
 * otherwise. Players with no update for 15s are dropped.
 */
interface Player {
  id: string;
  label: string;
  x: number;
  y: number;
  colorIndex: number;
  roomId: string;
  lastUpdate: number;
}

const STALE_MS = 15_000;
// A room's hash outlives its last player briefly, then expires on its own.
const ROOM_TTL_MS = 60_000;

const roomQuery = z.string().min(1).max(64).regex(/^[\w-]+$/);

// ---- in-memory store (local dev / single server) ----
const globalForMp = globalThis as unknown as { __mpPlayers?: Map<string, Player> };
const players: Map<string, Player> = globalForMp.__mpPlayers ?? new Map();
globalForMp.__mpPlayers = players;

const memory = {
  async list(roomId: string): Promise<Player[]> {
    const cutoff = Date.now() - STALE_MS;
    for (const [id, p] of players) if (p.lastUpdate < cutoff) players.delete(id);
    return [...players.values()].filter((p) => p.roomId === roomId);
  },
  async upsert(p: Player): Promise<Player[]> {
    players.set(p.id, p);
    return memory.list(p.roomId);
  },
  async colorOf(id: string): Promise<number | undefined> {
    return players.get(id)?.colorIndex;
  },
};

// ---- shared store (Upstash): one hash per room, field = user id ----
const roomKey = (roomId: string) => `presence:${roomId}`;

function fresh(raw: unknown, roomId: string): { live: Player[]; stale: string[] } {
  // HGETALL over REST returns a flat [field, value, field, value, …] list.
  const flat = Array.isArray(raw) ? (raw as string[]) : [];
  const cutoff = Date.now() - STALE_MS;
  const live: Player[] = [];
  const stale: string[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) {
    try {
      const p = JSON.parse(flat[i + 1]) as Player;
      if (p.lastUpdate >= cutoff && p.roomId === roomId) live.push(p);
      else stale.push(flat[i]);
    } catch {
      stale.push(flat[i]);
    }
  }
  return { live, stale };
}

const shared = {
  async list(roomId: string): Promise<Player[]> {
    const [raw] = await kvPipeline([["HGETALL", roomKey(roomId)]]);
    const { live, stale } = fresh(raw, roomId);
    if (stale.length) await kvPipeline([["HDEL", roomKey(roomId), ...stale]]);
    return live;
  },
  async upsert(p: Player): Promise<Player[]> {
    const [, , raw] = await kvPipeline([
      ["HSET", roomKey(p.roomId), p.id, JSON.stringify(p)],
      ["PEXPIRE", roomKey(p.roomId), ROOM_TTL_MS],
      ["HGETALL", roomKey(p.roomId)],
    ]);
    const { live, stale } = fresh(raw, p.roomId);
    if (stale.length) await kvPipeline([["HDEL", roomKey(p.roomId), ...stale]]);
    return live;
  },
  async colorOf(): Promise<number | undefined> {
    return undefined; // derived from the user id instead; saves a read
  },
};

const store = () => (isKvConfigured() ? shared : memory);

/** Others in the room, without internal fields. The caller isn't included. */
function others(list: Player[], selfId: string) {
  return list.filter((p) => p.id !== selfId);
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");
  const parsed = roomQuery.safeParse(new URL(req.url).searchParams.get("roomId") ?? "library");
  if (!parsed.success) return fail(400, "BAD_REQUEST", "Invalid roomId");
  try {
    return ok({ players: others(await store().list(parsed.data), user.id) });
  } catch (e) {
    console.error("Presence store unavailable", e);
    return ok({ players: [] }); // presence is best-effort
  }
}

const schema = z.object({
  x: z.number().min(-10_000).max(10_000),
  y: z.number().min(-10_000).max(10_000),
  roomId: roomQuery.default("library"),
  colorIndex: z.number().int().min(0).max(11).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return fail(400, "BAD_REQUEST", "Invalid JSON");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return fail(400, "BAD_REQUEST", "x and y are required");

  const s = store();
  try {
    const list = await s.upsert({
      id: user.id,
      label: user.displayName,
      x: parsed.data.x,
      y: parsed.data.y,
      roomId: parsed.data.roomId,
      colorIndex: parsed.data.colorIndex ?? (await s.colorOf(user.id)) ?? hashColor(user.id),
      lastUpdate: Date.now(),
    });
    return ok({ ok: true, players: others(list, user.id) });
  } catch (e) {
    console.error("Presence store unavailable", e);
    return ok({ ok: false, players: [] });
  }
}

function hashColor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 12;
  return h;
}
