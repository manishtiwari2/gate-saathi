import { isAbsolute, join } from "node:path";
import { isSupabaseStorageConfigured } from "@/lib/supabase-storage";

/**
 * Stored file paths are either relative to the project root (e.g.
 * "storage/library/x.pdf", shipped with the app or written to local disk) or
 * "supabase:<object path>" for uploads kept in Supabase Storage.
 * Older rows may hold absolute paths; those are used as-is.
 */
export function resolveStoragePath(storagePath: string): string {
  return isAbsolute(storagePath) ? storagePath : join(process.cwd(), storagePath);
}

/** Per-file upload limit (also set it as the Supabase bucket's file size limit). */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** A file name safe for disk and object paths, kept well under length limits. */
export const safeFileName = (name: string) => name.replace(/[^\w.\-() ]+/g, "_").slice(-120);

const SUPABASE_PREFIX = "supabase:";

export const supabaseStoragePath = (objectPath: string) => `${SUPABASE_PREFIX}${objectPath}`;

/** The Supabase object path for a stored file, or null if it lives on disk. */
export function supabaseObjectPath(storagePath: string): string | null {
  return storagePath.startsWith(SUPABASE_PREFIX) ? storagePath.slice(SUPABASE_PREFIX.length) : null;
}

/** Types that may be shown inline; everything else downloads. */
export const SAFE_INLINE = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/plain",
]);

export type UploadBackend = "supabase" | "disk" | "none";

/**
 * Where new uploads go. Supabase Storage when configured. Otherwise local
 * disk in development only: hosted servers (Netlify functions, Render free)
 * have no persistent disk, so uploads show "coming soon" there.
 * ENABLE_UPLOADS="false" turns uploads off; "true" forces disk.
 */
export function uploadBackend(): UploadBackend {
  if (process.env.ENABLE_UPLOADS === "false") return "none";
  if (isSupabaseStorageConfigured()) return "supabase";
  if (process.env.ENABLE_UPLOADS === "true") return "disk";
  return process.env.NODE_ENV === "production" ? "none" : "disk";
}

export function isUploadsEnabled(): boolean {
  return uploadBackend() !== "none";
}
