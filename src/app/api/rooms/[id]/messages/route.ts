import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { getMembership } from "@/lib/rooms";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");
  if (!(await getMembership(id, user.id))) return fail(403, "FORBIDDEN", "Not a member");

  const sinceParam = new URL(req.url).searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : null;
  if (since && Number.isNaN(since.getTime())) return fail(400, "BAD_REQUEST", "since must be an ISO date");

  // Newest 200 first from the DB, then oldest-to-newest for display.
  const messages = (
    await db.roomMessage.findMany({
      where: { roomId: id, ...(since ? { createdAt: { gt: since } } : {}) },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { id: true, displayName: true } } },
    })
  ).reverse();

  return ok({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      userId: m.userId,
      userName: m.user.displayName,
      isMine: m.userId === user.id,
      createdAt: m.createdAt,
    })),
  });
}

const schema = z.object({ body: z.string().min(1).max(2000) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");
  if (!(await getMembership(id, user.id))) return fail(403, "FORBIDDEN", "Not a member");

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return fail(400, "BAD_REQUEST", "Invalid JSON");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return fail(400, "BAD_REQUEST", "Message body is required");

  const msg = await db.roomMessage.create({
    data: { roomId: id, userId: user.id, body: parsed.data.body },
  });
  return ok({ id: msg.id, createdAt: msg.createdAt }, { status: 201 });
}
