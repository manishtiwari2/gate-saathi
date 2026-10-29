/**
 * Study-time aggregation. Days are calendar days in the learner's own time
 * zone (an IANA name such as "Asia/Kolkata"), so "today", streaks and daily
 * limits roll over at the learner's midnight, not at 00:00 UTC.
 */

/** Zone used when a user has none, and for site-wide "today" (the audience is Indian). */
export const DEFAULT_TIME_ZONE = "Asia/Kolkata";

export interface DayTotal {
  date: string; // YYYY-MM-DD in the learner's time zone
  seconds: number;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** A usable zone: the given one if valid, otherwise the default. */
export function resolveTimeZone(tz: string | null | undefined): string {
  return tz && isValidTimeZone(tz) ? tz : DEFAULT_TIME_ZONE;
}

/** The calendar date (YYYY-MM-DD) of `date` in `tz`. */
export function dayKey(date: Date, tz: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    date,
  );
}

/** Shift a YYYY-MM-DD key by `days` calendar days. */
export function addDays(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The instant of the most recent midnight in `tz` (start of "today" there). */
export function startOfDay(tz: string, now = new Date()): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  // Wall-clock time in tz, read as if it were UTC, minus the real instant
  // gives the zone's offset at `now`.
  const wallAsUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  const offsetMs = wallAsUtc - Math.floor(now.getTime() / 1000) * 1000;
  return new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day) - offsetMs);
}

/** Build a map of YYYY-MM-DD -> total seconds from study sessions. */
export function dailyTotals(
  sessions: Array<{ startedAt: Date; seconds: number }>,
  tz = "UTC",
): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const key = dayKey(s.startedAt, tz);
    map.set(key, (map.get(key) ?? 0) + s.seconds);
  }
  return map;
}

/** Current consecutive-day streak ending today or yesterday (in `tz`). */
export function computeStreak(totals: Map<string, number>, today = new Date(), tz = "UTC"): number {
  let streak = 0;
  let cursor = dayKey(today, tz);

  // Allow the streak to count from yesterday if nothing logged today yet.
  if (!totals.get(cursor)) cursor = addDays(cursor, -1);

  while ((totals.get(cursor) ?? 0) > 0) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
