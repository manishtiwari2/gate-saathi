import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { getMembership } from "@/lib/rooms";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");
  if (!(await getMembership(id, user.id))) return fail(403, "FORBIDDEN", "Not a member");

  const files = await db.roomFile.findMany({
    where: { roomId: id },
    include: { file: true },
    orderBy: { sharedAt: "desc" },
  });

  return ok({
    files: files.map((rf) => ({
      id: rf.file.id,
      name: rf.file.name,
      originalFilename: rf.file.originalFilename,
      mimeType: rf.file.mimeType,
      fileSize: rf.file.fileSize,
      sharedAt: rf.sharedAt,
    })),
  });
}
