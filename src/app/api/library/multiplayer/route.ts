import { z } from "zod";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";

/**
 * Lightweight presence channel for the virtual library, matching the
 * reference's polling model (POST to update position, GET to list players).
 * Presence is ephemeral and kept in process memory; stale players (no update
 * for 15s) are pruned. This is intentionally not durable — it is live presence.
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

// Survives module reloads in dev.
const globalForMp = globalThis as unknown as { __mpPlayers?: Map<string, Player> };
const players: Map<string, Player> = globalForMp.__mpPlayers ?? new Map();
globalForMp.__mpPlayers = players;

function prune() {
  const cutoff = Date.now() - STALE_MS;
  for (const [id, p] of players) if (p.lastUpdate < cutoff) players.delete(id);
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");
  prune();
  const roomId = new URL(req.url).searchParams.get("roomId");
  const list = [...players.values()].filter((p) => !roomId || p.roomId === roomId);
  return ok({ players: list.map(({ lastUpdate, ...rest }) => ({ ...rest, lastUpdate })) });
}

const schema = z.object({
  x: z.number(),
  y: z.number(),
  roomId: z.string().max(64).default("entrance"),
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

  const existing = players.get(user.id);
  players.set(user.id, {
    id: user.id,
    label: user.displayName,
    x: parsed.data.x,
    y: parsed.data.y,
    roomId: parsed.data.roomId,
    colorIndex: parsed.data.colorIndex ?? existing?.colorIndex ?? hashColor(user.id),
    lastUpdate: Date.now(),
  });
  return ok({ ok: true });
}

function hashColor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 12;
  return h;
}
