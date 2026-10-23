import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { estimateRank } from "@/lib/predictor";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const branch = sp.get("branch");
  const marks = Number(sp.get("marks"));

  if (!branch || Number.isNaN(marks)) {
    return fail(400, "BAD_REQUEST", "branch and marks are required");
  }

  // Use the most recent year's stats for this branch as the basis.
  const cutoff = await db.cutoff.findFirst({
    where: { branchCode: branch.toLowerCase() },
    orderBy: { year: "desc" },
  });
  if (!cutoff || !cutoff.totalApplicants || !cutoff.totalQualified || cutoff.generalCutoff == null) {
    return fail(404, "NOT_FOUND", "No cutoff statistics available for this branch");
  }

  const estimate = estimateRank(marks, {
    totalApplicants: cutoff.totalApplicants,
    totalQualified: cutoff.totalQualified,
    generalCutoff: cutoff.generalCutoff,
    maxMarks: cutoff.maxMarks ?? 100,
  });

  return ok({
    branch: branch.toUpperCase(),
    marks,
    basedOnYear: cutoff.year,
    ...estimate,
  });
}
