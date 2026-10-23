import { describe, it, expect } from "vitest";
import { dailyTotals, computeStreak } from "./stats";

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
