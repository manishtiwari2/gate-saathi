import { describe, it, expect } from "vitest";
import { gradeAnswer, parseNatRange, scorePaper } from "./grading";

const options = ["2", "4", "8", "16"];

describe("gradeAnswer MCQ", () => {
  it("accepts a key stored as option text", () => {
    const q = { questionType: "MCQ", options, correctAnswer: "8" };
    expect(gradeAnswer(q, "8")).toBe(true);
    expect(gradeAnswer(q, "C")).toBe(true);
    expect(gradeAnswer(q, "4")).toBe(false);
  });
  it("accepts a key stored as an official letter", () => {
    const q = { questionType: "MCQ", options, correctAnswer: "b" };
    expect(gradeAnswer(q, "4")).toBe(true);
    expect(gradeAnswer(q, "B")).toBe(true);
    expect(gradeAnswer(q, "A")).toBe(false);
  });
  it("returns null for a key that matches no option", () => {
    expect(gradeAnswer({ questionType: "MCQ", options, correctAnswer: "E" }, "A")).toBeNull();
    expect(gradeAnswer({ questionType: "MCQ", options, correctAnswer: "32" }, "A")).toBeNull();
  });
});

describe("gradeAnswer MSQ", () => {
  const q = { questionType: "MSQ", options, correctAnswer: "A;C" };
  it("ignores order and separators", () => {
    expect(gradeAnswer(q, "C,A")).toBe(true);
    expect(gradeAnswer(q, "A; C")).toBe(true);
  });
  it("requires the exact set", () => {
    expect(gradeAnswer(q, "A")).toBe(false);
    expect(gradeAnswer(q, "A;B;C")).toBe(false);
  });
});

describe("gradeAnswer NAT", () => {
  it("grades inside an inclusive range", () => {
    const q = { questionType: "NAT", options: [], correctAnswer: "0.25 to 0.30" };
    expect(gradeAnswer(q, "0.25")).toBe(true);
    expect(gradeAnswer(q, "0.3")).toBe(true);
    expect(gradeAnswer(q, "0.31")).toBe(false);
    expect(gradeAnswer(q, "abc")).toBe(false);
  });
  it("treats an exact value as a one-point range", () => {
    const q = { questionType: "NAT", options: [], correctAnswer: "5" };
    expect(gradeAnswer(q, "5.0")).toBe(true);
    expect(gradeAnswer(q, "5.01")).toBe(false);
  });
});

describe("parseNatRange", () => {
  it("parses ranges in either order and rejects junk", () => {
    expect(parseNatRange("3:1")).toEqual([1, 3]);
    expect(parseNatRange("-2 to -1")).toEqual([-2, -1]);
    expect(parseNatRange("")).toBeNull();
    expect(parseNatRange("about 3")).toBeNull();
  });
});

describe("NAT keys with several accepted ranges", () => {
  it("accepts any of the ranges", () => {
    const q = { questionType: "NAT", options: [], correctAnswer: "13.3 to 13.3 OR 13.5 to 13.5" };
    expect(gradeAnswer(q, "13.3")).toBe(true);
    expect(gradeAnswer(q, "13.5")).toBe(true);
    expect(gradeAnswer(q, "13.4")).toBe(false);
  });
});

describe("scorePaper (GATE marking)", () => {
  const qs = [
    { section: "GA", number: 1, type: "MCQ", key: "B", marks: 1 },
    { section: "CS", number: 30, type: "MCQ", key: "C", marks: 2 },
    { section: "CS", number: 31, type: "NAT", key: "3 to 4", marks: 2 },
    { section: "CS", number: 32, type: "MSQ", key: "A;C", marks: 2 },
    { section: "CS", number: 3, type: "MCQ", key: "MTA", marks: 1 },
    { section: "CS", number: 33, type: "MCQ", key: "A", marks: 2 },
  ];

  it("applies negative marking only to wrong MCQs and gives marks-to-all to everyone", () => {
    const r = scorePaper(qs, { "GA-1": "B", "CS-30": "A", "CS-31": "9", "CS-32": "C;A" });
    // +1 (GA-1) − 2/3 (CS-30) + 0 (wrong NAT) + 2 (MSQ) + 1 (MTA, unanswered) + 0 (unanswered)
    expect(r.score).toBe(3.33);
    expect(r.maxScore).toBe(10);
    expect([r.correct, r.wrong, r.unanswered]).toEqual([3, 2, 1]);
    expect(r.results.find((x) => x.id === "CS-30")?.awarded).toBeCloseTo(-2 / 3);
    expect(r.results.find((x) => x.id === "CS-31")?.awarded).toBe(-0);
  });
});
