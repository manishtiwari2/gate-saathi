/**
 * Imports official GATE answer keys into data/pyq/answers.json.
 *
 * Input: CSV files in data/pyq/official-keys/, transcribed from the official
 * answer-key PDFs published by the organising IIT. Header:
 *
 *   branch,year,session,questionNumber,type,key
 *   cs,2024,1,12,MCQ,B
 *   cs,2024,1,40,MSQ,A;C
 *   cs,2024,1,55,NAT,0.25 to 0.30
 *
 * An optional `questionId` column (the collected source id, e.g.
 * gate-cs-2024-2) targets one question exactly; use it where the collected
 * data gives several questions the same branch/year/session/number.
 *
 * A key is applied only when exactly one collected question matches, the type
 * agrees, and the key can be graded against that question (e.g. the letter
 * exists among its options). Everything else is reported and skipped — never
 * guessed.
 *
 * Run: npm run keys:import   (then npm run db:seed)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gradeAnswer } from "../src/lib/grading";

const DATA = join(process.cwd(), "data", "pyq");
const KEYS_DIR = join(DATA, "official-keys");
const ANSWERS = join(DATA, "answers.json");

type Collected = {
  id: string;
  questionId?: string;
  questionNumber?: string | number;
  questionType?: string;
  year?: number;
  session?: string | number;
  options?: string[];
};

function loadCollected(): Array<Collected & { branch: string }> {
  const parsed = JSON.parse(readFileSync(join(DATA, "questions-all-session.json"), "utf8"));
  const all = (typeof parsed === "string" ? JSON.parse(parsed) : parsed).all as Record<string, Collected[]>;
  return Object.entries(all).flatMap(([code, qs]) => qs.map((q) => ({ ...q, branch: code.toLowerCase() })));
}

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
  const header = lines.shift()?.split(",").map((h) => h.trim()) ?? [];
  return lines.map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
  });
}

function main() {
  if (!existsSync(KEYS_DIR)) {
    console.log(`No ${KEYS_DIR} directory. Add CSVs there first (see header of this script).`);
    return;
  }
  const files = readdirSync(KEYS_DIR).filter((f) => f.endsWith(".csv"));
  if (files.length === 0) {
    console.log("No CSV files in data/pyq/official-keys/.");
    return;
  }

  const collected = loadCollected();
  const bySourceId = new Map(collected.map((q) => [q.questionId, q]));
  const byKey = new Map<string, Array<Collected & { branch: string }>>();
  for (const q of collected) {
    const k = `${q.branch}|${q.year}|${q.session ?? ""}|${q.questionNumber ?? ""}`;
    byKey.set(k, [...(byKey.get(k) ?? []), q]);
  }

  const existing = existsSync(ANSWERS)
    ? (JSON.parse(readFileSync(ANSWERS, "utf8")) as { answers?: Record<string, string> }).answers ?? {}
    : {};
  const answers: Record<string, string> = { ...existing };

  let applied = 0;
  const problems: string[] = [];
  for (const file of files) {
    for (const row of parseCsv(readFileSync(join(KEYS_DIR, file), "utf8"))) {
      const where = `${file}: ${row.questionId || `${row.branch} ${row.year} S${row.session} Q${row.questionNumber}`}`;
      const k = `${row.branch?.toLowerCase()}|${row.year}|${row.session}|${row.questionNumber}`;
      const exact = row.questionId ? bySourceId.get(row.questionId) : undefined;
      const matches = row.questionId ? (exact ? [exact] : []) : byKey.get(k) ?? [];
      if (matches.length === 0) { problems.push(`${where}: no collected question`); continue; }
      if (matches.length > 1) { problems.push(`${where}: ${matches.length} collected questions match, ambiguous`); continue; }
      const q = matches[0];
      const type = (row.type || q.questionType || "MCQ").toUpperCase();
      if (q.questionType && q.questionType.toUpperCase() !== type) {
        problems.push(`${where}: key says ${type}, collected question is ${q.questionType}`);
        continue;
      }
      if (!row.key) { problems.push(`${where}: empty key`); continue; }
      // A key that cannot be interpreted against this question is rejected.
      if (gradeAnswer({ questionType: type, options: q.options ?? [], correctAnswer: row.key }, row.key) === null) {
        problems.push(`${where}: key "${row.key}" does not fit this question's options`);
        continue;
      }
      answers[q.id] = row.key;
      applied++;
    }
  }

  writeFileSync(
    ANSWERS,
    JSON.stringify({ generatedAt: new Date().toISOString(), source: "official answer keys", answers }, null, 2) + "\n",
  );
  console.log(`Applied ${applied} keys; ${Object.keys(answers).length} total in data/pyq/answers.json.`);
  if (problems.length) {
    console.log(`Skipped ${problems.length}:`);
    for (const p of problems) console.log(`  - ${p}`);
  }
  console.log("Next: npm run db:seed");
}

main();
