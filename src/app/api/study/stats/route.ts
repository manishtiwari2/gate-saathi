import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { dailyTotals, computeStreak } from "@/lib/stats";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  const period = new URL(req.url).searchParams.get("period") ?? "all";

  const sessions = await db.studySession.findMany({
    where: { userId: user.id },
    select: { startedAt: true, seconds: true },
  });

  const totalSeconds = sessions.reduce((a, s) => a + s.seconds, 0);
  const totals = dailyTotals(sessions);
  const streak = computeStreak(totals);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todaySeconds = totals.get(todayKey) ?? 0;
  const todayMinutes = Math.round(todaySeconds / 60);

  const goal = user.dailyGoalMin;
  const goalProgress = goal > 0 ? Math.min(100, Math.round((todayMinutes / goal) * 100)) : 0;

  const periodSeconds =
    period === "today" ? todaySeconds : period === "week" ? weekSeconds(totals) : totalSeconds;

  return ok({
    period,
    total: { hours: Math.floor(totalSeconds / 3600), minutes: Math.floor((totalSeconds % 3600) / 60) },
    periodTotal: { hours: Math.floor(periodSeconds / 3600), minutes: Math.floor((periodSeconds % 3600) / 60) },
    sessions: sessions.length,
    dailyGoal: goal,
    goalProgress,
    todayMinutes,
    streak: { current: streak },
    recentDays: lastNDays(totals, 30),
  });
}

function weekSeconds(totals: Map<string, number>): number {
  let sum = 0;
  const cursor = new Date();
  for (let i = 0; i < 7; i++) {
    const key = cursor.toISOString().slice(0, 10);
    sum += totals.get(key) ?? 0;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return sum;
}

function lastNDays(totals: Map<string, number>, n: number): Array<{ date: string; minutes: number }> {
  const out: Array<{ date: string; minutes: number }> = [];
  const cursor = new Date();
  for (let i = 0; i < n; i++) {
    const key = cursor.toISOString().slice(0, 10);
    out.unshift({ date: key, minutes: Math.round((totals.get(key) ?? 0) / 60) });
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return out;
}
