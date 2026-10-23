import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getBranch, BRANCH_CODES } from "@/lib/branches";
import { Kicker, Card, Badge } from "@/components/ui";

export function generateStaticParams() {
  return BRANCH_CODES.map((branch) => ({ branch }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ branch: string }>;
}): Promise<Metadata> {
  const { branch } = await params;
  const b = getBranch(branch);
  return {
    title: b ? `GATE 2027 ${b.code.toUpperCase()} Mock Tests: Trend-Based Papers` : "GATE Mock Papers",
  };
}

interface SubjectBreakdownItem {
  subject: string;
  marks: number;
  questions: number;
}

export default async function BranchPapersPage({
  params,
}: {
  params: Promise<{ branch: string }>;
}) {
  const { branch } = await params;
  const b = getBranch(branch);
  if (!b) notFound();

  const papers = await db.paper.findMany({ where: { branchCode: b.code }, orderBy: { id: "asc" } });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <nav className="text-sm text-[var(--muted)]">
        <Link href="/predicted-papers" className="hover:text-[var(--foreground)]">
          Mock Papers
        </Link>{" "}
        / <span className="text-[var(--foreground)]">{b.displayName}</span>
      </nav>

      <header className="mt-4">
        <Kicker>{b.code.toUpperCase()} · Trend-based mock papers</Kicker>
        <h1 className="mt-2 font-display text-4xl">GATE {b.displayName} Mock Papers</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Modelled on historical patterns. Preview the structure here; sign in to practice the full
          paper.
        </p>
      </header>

      {papers.length === 0 ? (
        <p className="mt-10 text-[var(--muted)]">No papers available for this branch yet.</p>
      ) : (
        <div className="mt-10 space-y-6">
          {papers.map((p) => {
            const meta = JSON.parse(p.meta) as {
              difficultyDistribution?: Record<string, number> | null;
              subjectBreakdown?: SubjectBreakdownItem[] | null;
            };
            const diff = meta.difficultyDistribution ?? {};
            const breakdown = meta.subjectBreakdown ?? [];
            return (
              <Card key={p.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{p.title}</h2>
                    {p.description && <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{p.description}</p>}
                  </div>
                  <div className="text-right text-sm text-[var(--muted)]">
                    <p>{p.totalQuestions} questions</p>
                    <p>{p.totalMarks} marks</p>
                  </div>
                </div>

                {Object.keys(diff).length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(diff).map(([k, v]) => (
                      <Badge key={k} tone="default">
                        <span className="capitalize">{k}</span>: {v}
                      </Badge>
                    ))}
                  </div>
                )}

                {breakdown.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase text-[var(--muted)]">
                        <tr>
                          <th className="py-2">Subject</th>
                          <th className="py-2 text-right">Questions</th>
                          <th className="py-2 text-right">Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {breakdown.map((s) => (
                          <tr key={s.subject} className="border-t border-[var(--border)]">
                            <td className="py-2">{s.subject}</td>
                            <td className="py-2 text-right">{s.questions}</td>
                            <td className="py-2 text-right">{s.marks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-5">
                  <Link
                    href="/login"
                    className="inline-flex rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
                  >
                    Sign in to practice the full paper
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
