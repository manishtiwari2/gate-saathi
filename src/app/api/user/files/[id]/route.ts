import { readFile, unlink } from "node:fs/promises";
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  const file = await db.userFile.findUnique({ where: { id } });
  if (!file) return fail(404, "NOT_FOUND", "File not found");
  if (file.userId !== user.id && file.visibility !== "published") {
    return fail(403, "FORBIDDEN", "Not your file");
  }

  try {
    const bytes = await readFile(file.storagePath);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "content-type": file.mimeType,
        "content-disposition": `inline; filename="${file.originalFilename}"`,
      },
    });
  } catch {
    return fail(410, "GONE", "File is no longer available");
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  const file = await db.userFile.findUnique({ where: { id } });
  if (!file) return fail(404, "NOT_FOUND", "File not found");
  if (file.userId !== user.id) return fail(403, "FORBIDDEN", "Not your file");

  await db.userFile.delete({ where: { id } });
  await unlink(file.storagePath).catch(() => {});
  return ok({ deleted: true });
}
