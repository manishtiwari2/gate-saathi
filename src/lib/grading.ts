/**
 * PYQ grading. Answer keys come from two sources and both are accepted:
 *  - the owner-run collector, which stores the correct option's text (MCQ);
 *  - official IIT answer keys, which use option letters ("B"), letter sets for
 *    MSQ ("A;C"), and a value or inclusive range for NAT ("12", "0.25 to 0.30").
 */

export type QuestionType = "MCQ" | "MSQ" | "NAT";

export interface Gradable {
  questionType: string;
  options: string[];
  correctAnswer: string;
}

const LETTERS = "ABCDEFGH";

/** Resolve an answer token (letter or exact option text) to an option index. */
function optionIndex(token: string, options: string[]): number | null {
  const t = token.trim();
  if (/^[A-Ha-h]$/.test(t)) {
    const i = LETTERS.indexOf(t.toUpperCase());
    return i < options.length ? i : null;
  }
  const i = options.findIndex((o) => o.trim() === t);
  return i >= 0 ? i : null;
}

function optionSet(answer: string, options: string[]): Set<number> | null {
  const parts = answer.split(/[;,]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const set = new Set<number>();
  for (const p of parts) {
    const i = optionIndex(p, options);
    if (i === null) return null;
    set.add(i);
  }
  return set;
}

/** Parse a NAT key: "12", "0.25 to 0.30", "0.25:0.30". */
export function parseNatRange(key: string): [number, number] | null {
  const m = key.trim().match(/^(-?\d*\.?\d+)\s*(?:to|:)\s*(-?\d*\.?\d+)$/i);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    return [Math.min(a, b), Math.max(a, b)];
  }
  const v = Number(key.trim());
  return key.trim() !== "" && Number.isFinite(v) ? [v, v] : null;
}

/**
 * Grade a submitted answer. Returns null when the key itself cannot be
 * interpreted, so the caller can report "unverified" instead of guessing.
 */
export function gradeAnswer(q: Gradable, selected: string): boolean | null {
  const type = q.questionType.toUpperCase();

  if (type === "NAT") {
    const range = parseNatRange(q.correctAnswer);
    if (!range) return null;
    const v = Number(selected.trim());
    if (selected.trim() === "" || !Number.isFinite(v)) return false;
    return v >= range[0] && v <= range[1];
  }

  if (type === "MSQ") {
    const key = optionSet(q.correctAnswer, q.options);
    if (!key) return null;
    const got = optionSet(selected, q.options);
    if (!got || got.size !== key.size) return false;
    return [...key].every((i) => got.has(i));
  }

  // MCQ
  const key = optionIndex(q.correctAnswer, q.options);
  if (key === null) return null;
  return optionIndex(selected, q.options) === key;
}
