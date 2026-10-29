import { db } from "@/lib/db";
import { ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { startOfDay, resolveTimeZone } from "@/lib/stats";

const DAILY_FREE_LIMIT = 5;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return ok({ signedIn: false });

  if (user.isPremium) {
    return ok({ signedIn: true, isPremium: true, limit: null, remaining: null });
  }

  // The daily allowance resets at the learner's own midnight.
  const startOfToday = startOfDay(resolveTimeZone(user.timezone));
  const usedToday = await db.doubtQuery.count({
    where: { userId: user.id, createdAt: { gte: startOfToday } },
  });

  return ok({
    signedIn: true,
    isPremium: false,
    limit: DAILY_FREE_LIMIT,
    remaining: Math.max(0, DAILY_FREE_LIMIT - usedToday),
  });
}
