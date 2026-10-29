import { describe, it, expect } from "vitest";
import { daysBetween } from "./ExamCountdown";

describe("daysBetween", () => {
  it("counts calendar days to the first exam day", () => {
    expect(daysBetween("2026-10-29", "2027-02-06")).toBe(100);
    expect(daysBetween("2027-02-05", "2027-02-06")).toBe(1);
    expect(daysBetween("2027-02-06", "2027-02-06")).toBe(0);
  });
});
