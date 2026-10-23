import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";

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
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail(400, "BAD_REQUEST", "No file provided");
  if (file.size > MAX_BYTES) return fail(413, "TOO_LARGE", "File exceeds 20 MB");

  const bytes = Buffer.from(await file.arrayBuffer());
  const id = randomUUID();
  const safeName = file.name.replace(/[^\w.\-() ]+/g, "_");
  const storagePath = join(STORAGE_DIR, `${id}-${safeName}`);

  await mkdir(STORAGE_DIR, { recursive: true });
  await writeFile(storagePath, bytes);

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
  });

  return ok({ id: record.id, name: record.name, file_size: record.fileSize }, { status: 201 });
}
