import { db } from "@/lib/db";
import { ok } from "@/lib/api";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  const branch = searchParams.get("branch");

  const rows = await db.userFile.findMany({
    where: { visibility: "published", ...(branch ? { branch } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return ok({
    resources: rows.map((r) => ({
      id: r.id,
      name: r.name,
      original_filename: r.originalFilename,
      mime_type: r.mimeType,
      file_size: r.fileSize,
      branch: r.branch,
      visibility: r.visibility,
      access_tier: r.accessTier,
      created_at: r.createdAt,
    })),
  });
}
