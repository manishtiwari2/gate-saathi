import { db } from "@/lib/db";
import { ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const period = sp.get("period") ?? "all";

  const since =
    period === "week"
      ? new Date(Date.now() - 7 * 86400_000)
      : period === "today"
        ? new Date(new Date().toISOString().slice(0, 10))
        : undefined;

  const grouped = await db.studySession.groupBy({
    by: ["userId"],
    where: since ? { startedAt: { gte: since } } : undefined,
    _sum: { seconds: true },
    orderBy: { _sum: { seconds: "desc" } },
    take: 100,
  });

  const users = await db.user.findMany({
    where: { id: { in: grouped.map((g) => g.userId) } },
    select: { id: true, displayName: true, username: true },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  const leaderboard = grouped.map((g, i) => ({
    rank: i + 1,
    userId: g.userId,
    name: userById.get(g.userId)?.displayName ?? "Student",
    username: userById.get(g.userId)?.username ?? null,
    totalSeconds: g._sum.seconds ?? 0,
  }));

  const me = await getCurrentUser();
  const myRow = me ? leaderboard.find((r) => r.userId === me.id) ?? null : null;

  return ok({
    period,
    scope: "global",
    leaderboard,
    me: me
      ? { user_id: me.id, rank: myRow?.rank ?? null, total_seconds: myRow?.totalSeconds ?? 0 }
      : null,
  });
}
