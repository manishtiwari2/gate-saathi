import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getBranch } from "@/lib/branches";

export async function GET(_req: Request, { params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  const b = getBranch(branch);
  if (!b) return fail(404, "NOT_FOUND", "Branch not found");

  const papers = await db.paper.findMany({ where: { branchCode: b.code }, orderBy: { id: "asc" } });
  return ok({
    branch: b.code.toUpperCase(),
    papers: papers.map((p) => {
      const meta = JSON.parse(p.meta) as {
        difficultyDistribution?: unknown;
        subjectBreakdown?: unknown;
      };
      return {
        id: p.id,
        branch: b.code.toUpperCase(),
        title: p.title,
        description: p.description,
        totalQuestions: p.totalQuestions,
        totalMarks: p.totalMarks,
        difficultyDistribution: meta.difficultyDistribution ?? null,
        subjectBreakdown: meta.subjectBreakdown ?? null,
      };
    }),
  });
}
