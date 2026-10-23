import type { Metadata } from "next";
import { db } from "@/lib/db";
import { BRANCHES } from "@/lib/branches";
import { Kicker } from "@/components/ui";
import { BranchGrid, type BranchWithCount } from "@/components/pyq/BranchGrid";

export const metadata: Metadata = {
  title: "GATE PYQs: Free Previous Year Questions by Branch",
  description:
    "Practice real GATE previous-year questions. Filter by branch, subject and year. Free to browse.",
};

export default async function PyqsPage() {
  const counts = await db.branch.findMany({ select: { code: true, questionCount: true } });
  const countByCode = new Map(counts.map((c) => [c.code, c.questionCount]));
  const branches: BranchWithCount[] = BRANCHES.map((b) => ({
    ...b,
    questionCount: countByCode.get(b.code) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <Kicker>Previous-year questions</Kicker>
        <h1 className="mt-3 font-display text-5xl">GATE Previous Year Questions — All Major Branches</h1>
        <p className="mt-4 text-lg text-[var(--muted)]">
          Practice real GATE questions. Filter by branch, subject and year. Learn from patterns that
          actually appeared in the exam.
        </p>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Choose Your Branch</h2>
        <div className="mt-6">
          <BranchGrid branches={branches} />
        </div>
      </section>

      <section className="mt-16 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--background-alt)] p-8">
        <h2 className="font-display text-2xl">Practice Every Question, Free</h2>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Anyone can preview questions. Sign in free to unlock the full question bank, track your
          attempts and build your mistake bank. Topic-wise filtering, heatmaps and trend analysis
          are Premium features.
        </p>
      </section>
    </div>
  );
}
