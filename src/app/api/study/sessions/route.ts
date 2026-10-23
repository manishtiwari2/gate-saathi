import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { getMembership } from "@/lib/rooms";

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

const schema = z.object({
  seconds: z.number().int().min(1).max(86400),
  subject: z.string().max(120).optional(),
  roomId: z.string().optional(),
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
  if (!parsed.success) return fail(400, "BAD_REQUEST", "seconds is required");

  // If a room is attributed, the user must actually be a member of it.
  if (parsed.data.roomId) {
    const m = await getMembership(parsed.data.roomId, user.id);
    if (!m) return fail(403, "FORBIDDEN", "Not a member of this room");
  }

  const now = new Date();
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
