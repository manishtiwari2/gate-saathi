import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { getMembership } from "@/lib/rooms";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  const sessions = await db.studySession.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    take: 50,
  });
  return ok({
    sessions: sessions.map((s) => ({
      id: s.id,
      subject: s.subject,
      seconds: s.seconds,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
    })),
  });
}

const DAY_SECONDS = 86400;

const schema = z.object({
  seconds: z.number().int().min(1).max(DAY_SECONDS),
  subject: z.string().max(120).optional(),
  roomId: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  const limited = rateLimit("study-session", user.id, 30, 60 * 60_000);
  if (limited) return limited;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return fail(400, "BAD_REQUEST", "Invalid JSON");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return fail(400, "BAD_REQUEST", "seconds is required");

  // If a room is attributed, the user must actually be a member of it.
  if (parsed.data.roomId) {
    const m = await getMembership(parsed.data.roomId, user.id);
    if (!m) return fail(403, "FORBIDDEN", "Not a member of this room");
  }

  // Logged time feeds the leaderboard, so a user cannot log more time in any
  // 24 hours than 24 hours actually contain.
  const now = new Date();
  const recent = await db.studySession.aggregate({
    where: { userId: user.id, endedAt: { gt: new Date(now.getTime() - DAY_SECONDS * 1000) } },
    _sum: { seconds: true },
  });
  if ((recent._sum.seconds ?? 0) + parsed.data.seconds > DAY_SECONDS) {
    return fail(422, "TOO_MUCH_TIME", "That is more study time than the last 24 hours allow.");
  }

  const session = await db.studySession.create({
    data: {
      userId: user.id,
      roomId: parsed.data.roomId ?? null,
      subject: parsed.data.subject ?? null,
      seconds: parsed.data.seconds,
      startedAt: new Date(now.getTime() - parsed.data.seconds * 1000),
      endedAt: now,
    },
  });
  return ok({ id: session.id }, { status: 201 });
}
