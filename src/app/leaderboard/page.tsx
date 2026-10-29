import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Kicker, Card } from "@/components/ui";
import { formatDuration } from "@/lib/utils";

export const metadata: Metadata = {
  title: "GATE Study Leaderboard: Compete With Friends",
  description: "See where you rank by study time logged with the focus timer.",
};

export default async function LeaderboardPage() {
  const grouped = await db.studySession.groupBy({
    by: ["userId"],
    _sum: { seconds: true },
    orderBy: { _sum: { seconds: "desc" } },
    take: 100,
  });
  const users = await db.user.findMany({
    where: { id: { in: grouped.map((g) => g.userId) } },
    select: { id: true, displayName: true },
  });
  const nameById = new Map(users.map((u) => [u.id, u.displayName]));
  const me = await getCurrentUser();

  const rows = grouped.map((g, i) => ({
    rank: i + 1,
    userId: g.userId,
    name: nameById.get(g.userId) ?? "Student",
    seconds: g._sum.seconds ?? 0,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Kicker>Leaderboard</Kicker>
      <h1 className="mt-3 font-display text-5xl">GATE Study Leaderboard</h1>
      <p className="mt-4 text-[var(--muted)]">Ranked by study time logged with the focus timer (at most 24 hours in any day).</p>

      <Card className="mt-10 p-0">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--muted)]">
            No study time logged yet. Start a focus session to appear here.
          </p>
        ) : (
          <ul>
            {rows.map((r) => (
              <li
                key={r.userId}
                className={`flex items-center justify-between border-b border-[var(--border)] px-5 py-3 last:border-0 ${
                  me?.id === r.userId ? "bg-[var(--accent-subtle)]" : ""
                }`}
              >
                <span className="flex items-center gap-4">
                  <span className="w-8 font-display text-lg text-[var(--muted)]">#{r.rank}</span>
                  <span className="font-medium">
                    {r.name}
                    {me?.id === r.userId && <span className="ml-2 text-xs text-[var(--accent)]">you</span>}
                  </span>
                </span>
                <span className="text-sm tabular-nums text-[var(--muted)]">{formatDuration(r.seconds)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
