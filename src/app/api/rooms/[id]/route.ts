import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { getMembership } from "@/lib/rooms";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  const room = await db.room.findUnique({ where: { id } });
  if (!room) return fail(404, "NOT_FOUND", "Room not found");

  const membership = await getMembership(id, user.id);
  if (!membership) return fail(403, "FORBIDDEN", "You are not a member of this room");

  return ok({
    id: room.id,
    name: room.name,
    description: room.description,
    roomKey: room.roomKey,
    isPrivate: room.isPrivate,
    isOwner: room.ownerId === user.id,
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  const room = await db.room.findUnique({ where: { id } });
  if (!room) return fail(404, "NOT_FOUND", "Room not found");

  // Owner deletes the room; a member just leaves.
  if (room.ownerId === user.id) {
    await db.room.delete({ where: { id } });
    return ok({ deleted: true });
  }
  await db.roomMember.deleteMany({ where: { roomId: id, userId: user.id } });
  return ok({ left: true });
}
