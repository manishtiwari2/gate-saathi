import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { getMembership } from "@/lib/rooms";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");
  if (!(await getMembership(id, user.id))) return fail(403, "FORBIDDEN", "Not a member");

  const members = await db.roomMember.findMany({
    where: { roomId: id },
    include: { user: { select: { id: true, displayName: true } } },
    orderBy: { joinedAt: "asc" },
  });

  // Consider a member "online" if they updated presence in the last 60s.
  const cutoff = Date.now() - 60_000;
  return ok({
    members: members.map((m) => ({
      userId: m.userId,
      name: m.user.displayName,
      role: m.role,
      presence: m.presence,
      isMe: m.userId === user.id,
      online: m.joinedAt.getTime() > cutoff || m.presence !== "away",
    })),
  });
}

const schema = z.object({ presence: z.enum(["active", "break", "away"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
  if (!parsed.success) return fail(400, "BAD_REQUEST", "Invalid presence");

  await db.roomMember.update({
    where: { roomId_userId: { roomId: id, userId: user.id } },
    data: { presence: parsed.data.presence },
  });
  return ok({ presence: parsed.data.presence });
}
