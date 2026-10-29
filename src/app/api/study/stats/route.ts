import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { dailyTotals, computeStreak, dayKey, addDays, resolveTimeZone } from "@/lib/stats";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  const period = new URL(req.url).searchParams.get("period") ?? "all";

  const sessions = await db.studySession.findMany({
    where: { userId: user.id },
    select: { startedAt: true, seconds: true },
  });

  // Days are the learner's own calendar days.
  const tz = resolveTimeZone(user.timezone);
  const totalSeconds = sessions.reduce((a, s) => a + s.seconds, 0);
  const totals = dailyTotals(sessions, tz);
  const now = new Date();
  const streak = computeStreak(totals, now, tz);

  const todayKey = dayKey(now, tz);
  const todaySeconds = totals.get(todayKey) ?? 0;
  const todayMinutes = Math.round(todaySeconds / 60);

  const goal = user.dailyGoalMin;
  const goalProgress = goal > 0 ? Math.min(100, Math.round((todayMinutes / goal) * 100)) : 0;

  const periodSeconds =
    period === "today" ? todaySeconds : period === "week" ? weekSeconds(totals, todayKey) : totalSeconds;

  return ok({
    period,
    total: { hours: Math.floor(totalSeconds / 3600), minutes: Math.floor((totalSeconds % 3600) / 60) },
    periodTotal: { hours: Math.floor(periodSeconds / 3600), minutes: Math.floor((periodSeconds % 3600) / 60) },
    sessions: sessions.length,
    dailyGoal: goal,
    goalProgress,
    todayMinutes,
    streak: { current: streak },
    recentDays: lastNDays(totals, todayKey, 30),
  });
}

function weekSeconds(totals: Map<string, number>, todayKey: string): number {
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += totals.get(addDays(todayKey, -i)) ?? 0;
  return sum;
}

function lastNDays(totals: Map<string, number>, todayKey: string, n: number): Array<{ date: string; minutes: number }> {
  const out: Array<{ date: string; minutes: number }> = [];
  for (let i = 0; i < n; i++) {
    const key = addDays(todayKey, -i);
    out.unshift({ date: key, minutes: Math.round((totals.get(key) ?? 0) / 60) });
  }
  return out;
}
