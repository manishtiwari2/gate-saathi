import { readFile, unlink } from "node:fs/promises";
import { fail } from "@/lib/api";
import { SAFE_INLINE, resolveStoragePath, supabaseObjectPath } from "@/lib/storage";
import { createSignedDownloadUrl, removeObjects } from "@/lib/supabase-storage";

interface StoredFile {
  storagePath: string;
  mimeType: string;
  originalFilename: string;
}

/**
 * Send a stored file. Call only after the access check. Supabase files
 * redirect to a 60-second signed URL on Storage's own origin; files on disk
 * are served here. Either way, only an allowlist of types renders inline.
 */
export async function serveStoredFile(file: StoredFile): Promise<Response> {
  const inline = SAFE_INLINE.has(file.mimeType);

  const objectPath = supabaseObjectPath(file.storagePath);
  if (objectPath) {
    try {
      const url = await createSignedDownloadUrl(objectPath, {
        downloadAs: inline ? undefined : file.originalFilename,
      });
      return new Response(null, { status: 302, headers: { location: url, "cache-control": "no-store" } });
    } catch (e) {
      console.error(e);
      return fail(502, "STORAGE_ERROR", "Couldn't open this file. Please try again.");
    }
  }

  let bytes: Buffer;
  try {
    bytes = await readFile(resolveStoragePath(file.storagePath));
  } catch {
    return fail(410, "GONE", "File is no longer available");
  }
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": inline ? file.mimeType : "application/octet-stream",
      "content-disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.originalFilename)}`,
      "x-content-type-options": "nosniff",
      "content-security-policy": "sandbox; default-src 'none'",
    },
  });
}

/** Best-effort removal of a stored file's bytes, after its row is deleted. */
export async function removeStoredFile(storagePath: string): Promise<void> {
  const objectPath = supabaseObjectPath(storagePath);
  if (objectPath) await removeObjects([objectPath]).catch((e) => console.error(e));
  else await unlink(resolveStoragePath(storagePath)).catch(() => {});
}
