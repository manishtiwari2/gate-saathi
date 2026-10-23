import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Kicker } from "@/components/ui";
import { CutoffTable, type CutoffRow } from "./CutoffTable";

export const metadata: Metadata = {
  title: "GATE Cutoff Marks: Previous Years, All Branches",
  description: "Historical GATE qualifying cutoff marks by year, branch and category.",
};

export default async function CutoffsPage() {
  const cutoffs = await db.cutoff.findMany({
    orderBy: [{ year: "desc" }, { branchCode: "asc" }],
  });

  const rows: CutoffRow[] = cutoffs.map((c) => ({
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
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <Kicker>Cutoffs</Kicker>
        <h1 className="mt-3 font-display text-5xl">GATE Cutoff Marks</h1>
        <p className="mt-4 text-lg text-[var(--muted)]">
          Qualifying cutoff marks from previous years, by branch and category.
        </p>
      </div>
      <div className="mt-10">
        <CutoffTable rows={rows} />
      </div>
    </div>
  );
}
