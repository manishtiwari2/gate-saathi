import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { estimateRank } from "@/lib/predictor";

// GATE publishes three qualifying cutoffs: General; OBC-NCL/EWS; SC/ST/PwD.
const CATEGORIES = ["general", "obc-ews", "sc-st-pwd"] as const;

const query = z.object({
  branch: z.string().min(1).max(8),
  marks: z.coerce.number().min(0).max(100),
  category: z.enum(CATEGORIES).default("general"),
});

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const parsed = query.safeParse({
    branch: sp.get("branch") ?? undefined,
    marks: sp.get("marks") ?? undefined,
    category: sp.get("category") ?? undefined,
  });
  if (!parsed.success) {
    return fail(400, "BAD_REQUEST", "branch and marks (0-100) are required");
  }
  const { branch, marks, category } = parsed.data;

  // Use the most recent year's stats for this branch as the basis.
  const cutoff = await db.cutoff.findFirst({
    where: { branchCode: branch.toLowerCase() },
    orderBy: { year: "desc" },
  });
  if (!cutoff || !cutoff.totalApplicants || !cutoff.totalQualified || cutoff.generalCutoff == null) {
    return fail(404, "NOT_FOUND", "No cutoff statistics available for this branch");
  }

  const categoryCutoff =
    category === "general" ? cutoff.generalCutoff : category === "obc-ews" ? cutoff.obcCutoff : cutoff.scCutoff;
  if (categoryCutoff == null) {
    return fail(404, "NOT_FOUND", `No ${category.toUpperCase()} cutoff recorded for ${branch.toUpperCase()} ${cutoff.year}`);
  }

  const estimate = estimateRank(marks, {
    totalApplicants: cutoff.totalApplicants,
    totalQualified: cutoff.totalQualified,
    generalCutoff: cutoff.generalCutoff,
    maxMarks: cutoff.maxMarks ?? 100,
    qualifyingCutoff: categoryCutoff,
  });

  return ok({
    branch: branch.toUpperCase(),
    marks,
    category,
    qualifyingCutoff: categoryCutoff,
    basedOnYear: cutoff.year,
    ...estimate,
  });
}
