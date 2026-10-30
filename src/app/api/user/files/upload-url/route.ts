import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_UPLOAD_BYTES, safeFileName, uploadBackend } from "@/lib/storage";
import { createSignedUploadUrl } from "@/lib/supabase-storage";

const Body = z.object({
  name: z.string().min(1).max(255),
  size: z.number().int().positive(),
});

/**
 * Step 1 of a Supabase upload: hand the browser a one-time URL to PUT the
 * file to. The object goes under the caller's own folder; step 2
 * (../complete) checks what actually arrived and records it.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");
  if (uploadBackend() !== "supabase") return fail(503, "COMING_SOON", "File uploads are coming soon.");

  const limited = await rateLimit("upload", user.id, 20, 60 * 60_000);
  if (limited) return limited;

  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return fail(400, "BAD_REQUEST", "Invalid file details");
  if (body.data.size > MAX_UPLOAD_BYTES) return fail(413, "TOO_LARGE", "File exceeds 20 MB");

  const id = randomUUID();
  try {
    const uploadUrl = await createSignedUploadUrl(`${user.id}/${id}/${safeFileName(body.data.name)}`);
    return ok({ id, uploadUrl });
  } catch (e) {
    console.error(e);
    return fail(502, "STORAGE_ERROR", "Couldn't start the upload. Please try again.");
  }
}
