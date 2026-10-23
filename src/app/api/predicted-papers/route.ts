import { db } from "@/lib/db";
import { ok } from "@/lib/api";
import { BRANCHES } from "@/lib/branches";

export async function GET() {
  const grouped = await db.paper.groupBy({ by: ["branchCode"], _count: { _all: true } });
  const countByCode = new Map(grouped.map((g) => [g.branchCode, g._count._all]));
  return ok({
    branches: BRANCHES.map((b) => ({
      branch: b.code.toUpperCase(),
      name: b.name,
      icon: b.icon,
      paperCount: countByCode.get(b.code) ?? 0,
    })),
  });
}
