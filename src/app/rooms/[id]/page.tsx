import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getMembership } from "@/lib/rooms";
import { withUser } from "@/components/RequireAuth";
import { Card, ButtonLink } from "@/components/ui";
import { RoomDetail } from "./RoomDetail";

export const metadata: Metadata = { title: "Study Room" };

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withUser(async (user) => {
    void user;
    const current = await getCurrentUser();
    const room = await db.room.findUnique({ where: { id } });
    if (!room) notFound();

    const membership = current ? await getMembership(id, current.id) : null;
    if (!membership) {
      return (
        <div className="mx-auto max-w-md px-4 py-24">
          <Card className="text-center">
            <h1 className="font-display text-2xl">You&apos;re not in this room</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Ask the owner for the room key and join from the Rooms page.
            </p>
            <div className="mt-6">
              <ButtonLink href="/rooms">Go to Rooms</ButtonLink>
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <RoomDetail
          room={{
            id: room.id,
            name: room.name,
            description: room.description,
            roomKey: room.roomKey,
            isOwner: room.ownerId === current!.id,
          }}
        />
      </div>
    );
  });
}
