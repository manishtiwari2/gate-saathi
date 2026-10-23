import { redirect } from "next/navigation";

export default async function LibraryRoomPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  await params;
  redirect("/library/world");
}
