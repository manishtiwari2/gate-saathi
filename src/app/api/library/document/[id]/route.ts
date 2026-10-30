import { db } from "@/lib/db";
import { fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { serveStoredFile } from "@/lib/serve-file";

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

  return serveStoredFile(file);
}
