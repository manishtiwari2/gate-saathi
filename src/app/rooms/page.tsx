import type { Metadata } from "next";
import { withUser } from "@/components/RequireAuth";
import { RoomsClient } from "./RoomsClient";

export const metadata: Metadata = {
  title: "GATE Study Rooms: Study Online With Friends",
  description: "Create or join private study rooms with a focus timer, chat and shared files.",
};

export default async function RoomsPage() {
  return withUser(() => (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <RoomsClient />
    </div>
  ));
}
