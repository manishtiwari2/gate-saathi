import { describe, it, expect } from "vitest";
import { estimateRank, type BranchStats } from "./predictor";

const cs: BranchStats = {
  totalApplicants: 155000,
  totalQualified: 19500,
  generalCutoff: 28,
  maxMarks: 100,
};

describe("estimateRank", () => {
  it("marks the candidate as qualifying at/above the cutoff", () => {
    expect(estimateRank(28, cs).qualifies).toBe(true);
    expect(estimateRank(27, cs).qualifies).toBe(false);
  });

  it("gives a better (lower) rank for higher marks", () => {
    const low = estimateRank(40, cs).estimatedRank;
    const high = estimateRank(80, cs).estimatedRank;
    expect(high).toBeLessThan(low);
  });

  it("rank at the cutoff is near total qualified", () => {
    const r = estimateRank(28, cs).estimatedRank;
    expect(r).toBeGreaterThan(10000);
    expect(r).toBeLessThanOrEqual(19500);
  });

  it("top marks yield a near-top rank", () => {
    expect(estimateRank(100, cs).estimatedRank).toBeLessThan(50);
  });

  it("returns a band around the estimate and a bounded percentile", () => {
    const r = estimateRank(55, cs);
    expect(r.rankLow).toBeLessThanOrEqual(r.estimatedRank);
    expect(r.rankHigh).toBeGreaterThanOrEqual(r.estimatedRank);
    expect(r.percentile).toBeGreaterThanOrEqual(0);
    expect(r.percentile).toBeLessThanOrEqual(100);
  });

  it("qualifies against the candidate's category cutoff without changing rank", () => {
    const general = estimateRank(20, cs);
    const reserved = estimateRank(20, { ...cs, qualifyingCutoff: 18 });
    expect(general.qualifies).toBe(false);
    expect(reserved.qualifies).toBe(true);
    expect(reserved.estimatedRank).toBe(general.estimatedRank);
  });
});
