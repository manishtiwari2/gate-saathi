export interface DayTotal {
  date: string; // YYYY-MM-DD (UTC)
  seconds: number;
}

/** Build a map of YYYY-MM-DD -> total seconds from study sessions. */
export function dailyTotals(sessions: Array<{ startedAt: Date; seconds: number }>): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const key = s.startedAt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + s.seconds);
  }
  return map;
}

/** Current consecutive-day streak ending today or yesterday (UTC). */
export function computeStreak(totals: Map<string, number>, today = new Date()): number {
  let streak = 0;
  const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  // Allow the streak to count from yesterday if nothing logged today yet.
  const todayKey = cursor.toISOString().slice(0, 10);
  if (!totals.get(todayKey)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if ((totals.get(key) ?? 0) > 0) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
