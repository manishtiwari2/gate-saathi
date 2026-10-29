import { db } from "@/lib/db";

/** GATE CS papers run 180 minutes. */
export const PAPER_MINUTES = 180;

export interface PaperSummary {
  id: string;
  year: number;
  setLabel: string | null;
  institute: string | null;
  note: string | null;
  pdfPath: string;
  pages: number;
  keyStatus: string;
  source: string;
}

/** Question metadata for the answer sheet. Never includes the key. */
export interface SheetQuestion {
  id: string; // "CS-12"
  section: string;
  number: number;
  type: string;
  marks: number;
}

export function paperTitle(p: { year: number; setLabel: string | null }) {
  return `GATE ${p.year} CS${p.setLabel ? ` · ${p.setLabel}` : ""}`;
}

export async function listPapers(branchCode = "cs"): Promise<PaperSummary[]> {
  return db.officialPaper.findMany({
    where: { branchCode },
    orderBy: [{ year: "desc" }, { id: "asc" }],
    select: {
      id: true, year: true, setLabel: true, institute: true, note: true,
      pdfPath: true, pages: true, keyStatus: true, source: true,
    },
  });
}

/** A paper and its answer sheet (question order as printed), without keys. */
export async function getPaperSheet(id: string) {
  const paper = await db.officialPaper.findUnique({
    where: { id },
    include: { questions: { select: { section: true, number: true, type: true, marks: true } } },
  });
  if (!paper) return null;
  // Printed order: GA first, except continuous-numbered papers (CS 1-55, then GA 56-65).
  const gaFirst = paper.numbering !== "continuous";
  const questions: SheetQuestion[] = [...paper.questions]
    .sort((a, b) =>
      a.section === b.section ? a.number - b.number : (a.section === "GA") === gaFirst ? -1 : 1,
    )
    .map((q) => ({ id: `${q.section}-${q.number}`, ...q }));
  const { questions: _omit, ...rest } = paper;
  void _omit;
  return { paper: rest, questions };
}
