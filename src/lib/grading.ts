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

/** A NAT key may accept several ranges: "13.3 to 13.3 OR 13.5 to 13.5". */
export function parseNatRanges(key: string): Array<[number, number]> | null {
  const ranges = key.split(/\s+OR\s+/i).map(parseNatRange);
  return ranges.every((r): r is [number, number] => r !== null) ? ranges : null;
}

/** Official keys mark a dropped question "MTA": every candidate gets the marks. */
export const MARKS_TO_ALL = "MTA";

/**
 * Grade a submitted answer. Returns null when the key itself cannot be
 * interpreted, so the caller can report "unverified" instead of guessing.
 */
export function gradeAnswer(q: Gradable, selected: string): boolean | null {
  const type = q.questionType.toUpperCase();
  if (q.correctAnswer.trim().toUpperCase() === MARKS_TO_ALL) return true;

  if (type === "NAT") {
    const ranges = parseNatRanges(q.correctAnswer);
    if (!ranges) return null;
    const v = Number(selected.trim());
    if (selected.trim() === "" || !Number.isFinite(v)) return false;
    return ranges.some(([lo, hi]) => v >= lo && v <= hi);
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

// ---- Whole-paper scoring with GATE's marking scheme ----

/** Official papers have no option text; answers are option letters. */
export const PAPER_OPTIONS = ["A", "B", "C", "D"];

export interface PaperQuestion {
  section: string;
  number: number;
  type: string;
  key: string;
  marks: number;
}

export interface QuestionResult {
  id: string; // "CS-12"
  answer: string | null;
  status: "correct" | "wrong" | "unanswered";
  awarded: number;
}

export const questionId = (q: { section: string; number: number }) => `${q.section}-${q.number}`;

/**
 * GATE marking: a wrong MCQ loses a third of its marks (1/3 or 2/3); MSQ and
 * NAT have no negative marking; unanswered scores 0; a "marks to all"
 * question gives everyone full marks.
 */
export function scorePaper(questions: PaperQuestion[], answers: Record<string, string>) {
  let score = 0;
  let maxScore = 0;
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  const results: QuestionResult[] = [];

  for (const q of questions) {
    const id = questionId(q);
    const answer = answers[id]?.trim() || null;
    maxScore += q.marks;
    const mta = q.key.trim().toUpperCase() === MARKS_TO_ALL;

    if (!answer && !mta) {
      unanswered++;
      results.push({ id, answer: null, status: "unanswered", awarded: 0 });
      continue;
    }
    const ok = mta || gradeAnswer({ questionType: q.type, options: PAPER_OPTIONS, correctAnswer: q.key }, answer!) === true;
    if (ok) {
      correct++;
      score += q.marks;
      results.push({ id, answer, status: "correct", awarded: q.marks });
    } else {
      wrong++;
      const penalty = q.type.toUpperCase() === "MCQ" ? q.marks / 3 : 0;
      score -= penalty;
      results.push({ id, answer, status: "wrong", awarded: -penalty });
    }
  }

  return { score: Math.round(score * 100) / 100, maxScore, correct, wrong, unanswered, results };
}
