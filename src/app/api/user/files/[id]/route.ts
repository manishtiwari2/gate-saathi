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
  // Owner-only here. Published library content is served (with its tier check)
  // through /api/library/document/[id].
  if (file.userId !== user.id) return fail(403, "FORBIDDEN", "Not your file");

  try {
    const bytes = await readFile(file.storagePath);
    // Never render arbitrary user content inline on the app origin. Only a
    // small allowlist may be shown inline; everything else downloads.
    const SAFE_INLINE = new Set([
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "text/plain",
    ]);
    const inline = SAFE_INLINE.has(file.mimeType);
    const type = inline ? file.mimeType : "application/octet-stream";
    const disp = inline ? "inline" : "attachment";
    return new Response(new Uint8Array(bytes), {
      headers: {
        "content-type": type,
        "content-disposition": `${disp}; filename*=UTF-8''${encodeURIComponent(file.originalFilename)}`,
        "x-content-type-options": "nosniff",
        "content-security-policy": "sandbox; default-src 'none'",
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
