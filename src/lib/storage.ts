import { isAbsolute, join } from "node:path";

/**
 * Stored file paths are relative to the project root (e.g.
 * "storage/library/x.pdf") so they work wherever the app is deployed.
 * Older rows may hold absolute paths; those are used as-is.
 */
export function resolveStoragePath(storagePath: string): string {
  return isAbsolute(storagePath) ? storagePath : join(process.cwd(), storagePath);
}

/**
 * User uploads need a persistent disk. Serverless hosts such as Vercel have a
 * read-only, per-request filesystem, so uploads are off there unless object
 * storage is added later. Library PDFs ship with the app and keep working.
 */
export function isUploadsEnabled(): boolean {
  if (process.env.ENABLE_UPLOADS === "true") return true;
  if (process.env.ENABLE_UPLOADS === "false") return false;
  return !process.env.VERCEL;
}
