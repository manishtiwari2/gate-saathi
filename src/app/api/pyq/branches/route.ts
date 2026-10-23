import { db } from "@/lib/db";
import { ok } from "@/lib/api";

export async function GET() {
  const branches = await db.branch.findMany({
    orderBy: { questionCount: "desc" },
    include: { _count: { select: { subjects: true } } },
  });
  return ok({
    branches: branches.map((b) => ({
      branchCode: b.code.toUpperCase(),
      branchName: b.name,
      displayName: b.displayName,
      icon: b.icon,
      questionCount: b.questionCount,
      yearMin: b.yearMin,
      yearMax: b.yearMax,
      subjectCount: b._count.subjects,
      availableYears:
        b.yearMin && b.yearMax
          ? Array.from({ length: b.yearMax - b.yearMin + 1 }, (_, i) => b.yearMin! + i)
          : [],
    })),
  });
}
