import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({ roomKey: z.string().min(1).max(12) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "BAD_REQUEST", "Invalid JSON");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(400, "BAD_REQUEST", "Room key is required");

  const room = await db.room.findUnique({ where: { roomKey: parsed.data.roomKey.toUpperCase() } });
  if (!room) return fail(404, "NOT_FOUND", "No room with that key");

  await db.roomMember.upsert({
    where: { roomId_userId: { roomId: room.id, userId: user.id } },
    update: {},
    create: { roomId: room.id, userId: user.id, role: "member" },
  });

  return ok({ id: room.id, name: room.name });
}
