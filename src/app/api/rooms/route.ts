import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { generateRoomKey } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  const memberships = await db.roomMember.findMany({
    where: { userId: user.id },
    include: { room: { include: { _count: { select: { members: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  return ok({
    rooms: memberships.map((m) => ({
      id: m.room.id,
      name: m.room.name,
      description: m.room.description,
      roomKey: m.room.roomKey,
      isOwner: m.room.ownerId === user.id,
      memberCount: m.room._count.members,
      createdAt: m.room.createdAt,
    })),
  });
}

const createSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(280).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  const limited = await rateLimit("room-create", user.id, 10, 60 * 60_000);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "BAD_REQUEST", "Invalid JSON");
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return fail(400, "BAD_REQUEST", "Room name is required");

  // Generate a unique room key.
  let roomKey: string | null = null;
  for (let i = 0; i < 5 && !roomKey; i++) {
    const candidate = generateRoomKey();
    if (!(await db.room.findUnique({ where: { roomKey: candidate } }))) roomKey = candidate;
  }
  if (!roomKey) return fail(503, "KEY_EXHAUSTED", "Could not allocate a room key. Please try again.");

  const room = await db.room.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      roomKey,
      ownerId: user.id,
      members: { create: { userId: user.id, role: "owner" } },
    },
  });

  return ok({ id: room.id, name: room.name, roomKey: room.roomKey }, { status: 201 });
}
