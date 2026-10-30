import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_UPLOAD_BYTES, supabaseStoragePath, uploadBackend } from "@/lib/storage";
import { listFolder, removeObjects } from "@/lib/supabase-storage";

const Body = z.object({
  id: z.string().uuid(),
  originalFilename: z.string().min(1).max(255),
});

/**
 * Step 2 of a Supabase upload: record the file the browser just uploaded.
 * Size and type come from Storage, not the client, and the folder is always
 * the caller's own, so nobody can claim another user's object.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");
  if (uploadBackend() !== "supabase") return fail(503, "COMING_SOON", "File uploads are coming soon.");

  const limited = await rateLimit("upload-complete", user.id, 40, 60 * 60_000);
  if (limited) return limited;

  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return fail(400, "BAD_REQUEST", "Invalid upload");
  const { id, originalFilename } = body.data;

  const folder = `${user.id}/${id}`;
  let objects;
  try {
    objects = await listFolder(folder);
  } catch (e) {
    console.error(e);
    return fail(502, "STORAGE_ERROR", "Couldn't confirm the upload. Please try again.");
  }
  const object = objects[0];
  if (objects.length !== 1 || !object) return fail(404, "NOT_FOUND", "Upload not found");

  const objectPath = `${folder}/${object.name}`;
  if (object.size > MAX_UPLOAD_BYTES) {
    await removeObjects([objectPath]).catch(() => {});
    return fail(413, "TOO_LARGE", "File exceeds 20 MB");
  }

  const exists = await db.userFile.findUnique({ where: { id }, select: { id: true } });
  if (exists) return fail(409, "CONFLICT", "Upload already recorded");

  const record = await db.userFile.create({
    data: {
      id,
      userId: user.id,
      name: object.name,
      originalFilename,
      mimeType: object.mimeType,
      fileSize: object.size,
      storagePath: supabaseStoragePath(objectPath),
    },
  });
  return ok({ id: record.id, name: record.name, file_size: record.fileSize }, { status: 201 });
}
