import { db } from "@/lib/db";

/** Returns the membership row if the user belongs to the room, else null. */
export async function getMembership(roomId: string, userId: string) {
  return db.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
}
