import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { BRANCHES } from "@/lib/branches";
import { Kicker, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "GATE 2027 Mock Tests: Free Trend-Based Papers",
  description:
    "Trend-based GATE mock papers for every branch, modelled on historical question patterns. Not predictions of the real paper.",
};

export default async function PredictedPapersPage() {
  const grouped = await db.paper.groupBy({ by: ["branchCode"], _count: { _all: true } });
  const countByCode = new Map(grouped.map((g) => [g.branchCode, g._count._all]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <Kicker>Mock papers</Kicker>
        <h1 className="mt-3 font-display text-5xl">Trend-Based Mock Papers</h1>
        <p className="mt-4 text-lg text-[var(--muted)]">
          Practice simulations based on historical question patterns — not predictions of the actual
          GATE paper. Four papers per branch.
        </p>
      </div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BRANCHES.map((b) => (
          <li key={b.code}>
            <Link href={`/predicted-papers/${b.code}`} className="block h-full">
              <Card className="flex h-full items-center justify-between transition-colors hover:border-[var(--accent)]">
                <span className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    {b.icon}
                  </span>
                  <span>
                    <span className="block font-medium">{b.displayName}</span>
                    <span className="block text-xs uppercase text-[var(--muted)]">{b.code}</span>
                  </span>
                </span>
                <span className="text-sm text-[var(--muted)]">
                  {countByCode.get(b.code) ?? 0} papers
                </span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
