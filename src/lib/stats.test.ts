import { describe, it, expect } from "vitest";
import { dailyTotals, computeStreak, dayKey, startOfDay, resolveTimeZone, addDays } from "./stats";

function session(dateIso: string, seconds: number) {
  return { startedAt: new Date(dateIso), seconds };
}

describe("dailyTotals", () => {
  it("sums seconds per UTC day", () => {
    const totals = dailyTotals([
      session("2026-10-20T10:00:00Z", 600),
      session("2026-10-20T15:00:00Z", 300),
      session("2026-10-21T09:00:00Z", 1200),
    ]);
    expect(totals.get("2026-10-20")).toBe(900);
    expect(totals.get("2026-10-21")).toBe(1200);
  });
});

describe("computeStreak", () => {
  const today = new Date("2026-10-24T12:00:00Z");

  it("counts consecutive days ending today", () => {
    const totals = dailyTotals([
      session("2026-10-24T08:00:00Z", 60),
      session("2026-10-23T08:00:00Z", 60),
      session("2026-10-22T08:00:00Z", 60),
    ]);
    expect(computeStreak(totals, today)).toBe(3);
  });

  it("still counts if today is empty but yesterday was active", () => {
    const totals = dailyTotals([
      session("2026-10-23T08:00:00Z", 60),
      session("2026-10-22T08:00:00Z", 60),
    ]);
    expect(computeStreak(totals, today)).toBe(2);
  });

  it("breaks on a gap", () => {
    const totals = dailyTotals([
      session("2026-10-24T08:00:00Z", 60),
      session("2026-10-22T08:00:00Z", 60),
    ]);
    expect(computeStreak(totals, today)).toBe(1);
  });

  it("is zero with no activity", () => {
    expect(computeStreak(new Map(), today)).toBe(0);
  });
});

describe("time zones", () => {
  const IST = "Asia/Kolkata";

  it("puts a late-evening IST session on the IST date, not the UTC one", () => {
    // 2026-10-20 20:00 UTC is 2026-10-21 01:30 in India.
    const totals = dailyTotals([session("2026-10-20T20:00:00Z", 600)], IST);
    expect(totals.get("2026-10-21")).toBe(600);
    expect(totals.get("2026-10-20")).toBeUndefined();
  });

  it("starts the IST day at 18:30 UTC the previous evening", () => {
    expect(startOfDay(IST, new Date("2026-10-21T03:00:00Z")).toISOString()).toBe("2026-10-20T18:30:00.000Z");
    expect(startOfDay("UTC", new Date("2026-10-21T03:00:00Z")).toISOString()).toBe("2026-10-21T00:00:00.000Z");
  });

  it("counts a streak in the learner's zone", () => {
    // Both sessions are the same UTC day but consecutive IST days.
    const totals = dailyTotals(
      [session("2026-10-20T17:00:00Z", 60), session("2026-10-20T19:00:00Z", 60)],
      IST,
    );
    expect(computeStreak(totals, new Date("2026-10-20T20:00:00Z"), IST)).toBe(2);
  });

  it("formats keys and shifts days across month ends", () => {
    expect(dayKey(new Date("2026-10-31T19:00:00Z"), IST)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("falls back to IST for an unknown zone", () => {
    expect(resolveTimeZone("Mars/Olympus")).toBe(IST);
    expect(resolveTimeZone("Europe/London")).toBe("Europe/London");
  });
});
