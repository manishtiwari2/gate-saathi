import { writeFile, mkdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { isUploadsEnabled } from "@/lib/storage";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB per file
const STORAGE_DIR = join(process.cwd(), "storage", "user");

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  const files = await db.userFile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const used = files.reduce((a, f) => a + f.fileSize, 0);
  return ok({
    files: files.map((f) => ({
      id: f.id,
      name: f.name,
      original_filename: f.originalFilename,
      mime_type: f.mimeType,
      file_size: f.fileSize,
      visibility: f.visibility,
      created_at: f.createdAt,
    })),
    usage: { usedBytes: used },
    uploadsEnabled: isUploadsEnabled(),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  if (!isUploadsEnabled()) {
    return fail(503, "COMING_SOON", "File uploads are coming soon.");
  }

  const limited = await rateLimit("upload", user.id, 20, 60 * 60_000);
  if (limited) return limited;

  // Reject oversized bodies before formData() buffers them into memory.
  // (Allow some headroom for multipart boundaries and headers.)
  const declared = Number(req.headers.get("content-length"));
  if (!declared) return fail(411, "LENGTH_REQUIRED", "Content-Length is required");
  if (declared > MAX_BYTES + 64 * 1024) return fail(413, "TOO_LARGE", "File exceeds 20 MB");

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail(400, "BAD_REQUEST", "No file provided");
  if (file.size > MAX_BYTES) return fail(413, "TOO_LARGE", "File exceeds 20 MB");

  const bytes = Buffer.from(await file.arrayBuffer());
  const id = randomUUID();
  // Keep names well under filesystem limits (the uuid prefix adds 37 chars).
  const safeName = file.name.replace(/[^\w.\-() ]+/g, "_").slice(-120);
  const storagePath = join(STORAGE_DIR, `${id}-${safeName}`);

  await mkdir(STORAGE_DIR, { recursive: true });
  await writeFile(storagePath, bytes);

  // Don't leave an orphaned file on disk if the DB write fails.
  const record = await db.userFile.create({
    data: {
      id,
      userId: user.id,
      name: safeName,
      originalFilename: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      storagePath,
    },
  }).catch(async (e) => {
    await unlink(storagePath).catch(() => {});
    throw e;
  });

  return ok({ id: record.id, name: record.name, file_size: record.fileSize }, { status: 201 });
}
