import { readFile } from "node:fs/promises";
import { db } from "@/lib/db";
import { fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { resolveStoragePath } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  const file = await db.userFile.findUnique({ where: { id } });
  if (!file || file.visibility !== "published") return fail(404, "NOT_FOUND", "File not found");

  // Premium-tier content requires a premium entitlement.
  if (file.accessTier === "premium" && !user.isPremium) {
    return fail(403, "FORBIDDEN", "This is Premium content");
  }

  let bytes: Buffer;
  try {
    bytes = await readFile(resolveStoragePath(file.storagePath));
  } catch {
    return fail(410, "GONE", "File is no longer available");
  }

  // Never render arbitrary user content inline on the app origin. Only a small
  // allowlist may be shown inline; everything else downloads.
  const SAFE_INLINE = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "text/plain",
  ]);
  const inline = SAFE_INLINE.has(file.mimeType);

  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": inline ? file.mimeType : "application/octet-stream",
      "content-disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.originalFilename)}`,
      "x-content-type-options": "nosniff",
      "content-security-policy": "sandbox; default-src 'none'",
    },
  });
}
