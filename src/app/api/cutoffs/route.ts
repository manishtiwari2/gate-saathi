import { db } from "@/lib/db";
import { ok } from "@/lib/api";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const branch = sp.get("branch");
  const year = sp.get("year");

  const cutoffs = await db.cutoff.findMany({
    where: {
      ...(branch ? { branchCode: branch.toLowerCase() } : {}),
      ...(year ? { year: Number(year) } : {}),
    },
    orderBy: [{ year: "desc" }, { branchCode: "asc" }],
  });

  return ok({
    cutoffs: cutoffs.map((c) => ({
      year: c.year,
      branchCode: c.branchCode.toUpperCase(),
      branchName: c.branchName,
      generalCutoff: c.generalCutoff,
      obCutoff: c.obcCutoff,
      scCutoff: c.scCutoff,
      stCutoff: c.stCutoff,
      totalApplicants: c.totalApplicants,
      totalQualified: c.totalQualified,
      qualifyingRate: c.qualifyingRate,
      maxMarks: c.maxMarks,
    })),
    total: cutoffs.length,
  });
}
