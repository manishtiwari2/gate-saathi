import { describe, it, expect } from "vitest";
import { gradeAnswer, parseNatRange } from "./grading";

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
