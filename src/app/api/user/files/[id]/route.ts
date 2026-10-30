import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { removeStoredFile, serveStoredFile } from "@/lib/serve-file";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  const file = await db.userFile.findUnique({ where: { id } });
  if (!file) return fail(404, "NOT_FOUND", "File not found");
  // Owner-only here. Published library content is served (with its tier check)
  // through /api/library/document/[id].
  if (file.userId !== user.id) return fail(403, "FORBIDDEN", "Not your file");

  return serveStoredFile(file);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  const file = await db.userFile.findUnique({ where: { id } });
  if (!file) return fail(404, "NOT_FOUND", "File not found");
  if (file.userId !== user.id) return fail(403, "FORBIDDEN", "Not your file");

  await db.userFile.delete({ where: { id } });
  await removeStoredFile(file.storagePath);
  return ok({ deleted: true });
}
