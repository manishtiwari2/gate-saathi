"use client";

import { Card } from "@/components/ui";
import type { SheetQuestion } from "@/lib/papers";
import { questionLabel } from "./AnswerInput";

export interface SubmitResult {
  score: number;
  maxScore: number;
  correct: number;
  wrong: number;
  unanswered: number;
  results: Array<{ id: string; answer: string | null; status: "correct" | "wrong" | "unanswered"; awarded: number }>;
  keys: Record<string, string>;
  saved: boolean;
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

/** Score summary plus a per-question review against the official key. */
export function PaperResults({
  result,
  questions,
  continuous,
}: {
  result: SubmitResult;
  questions: SheetQuestion[];
  continuous: boolean;
}) {
  const byId = new Map(result.results.map((r) => [r.id, r]));
  return (
    <div className="space-y-4">
      <Card>
        <p className="kicker">Your score (GATE marking)</p>
        <p className="mt-1 font-display text-5xl">
          {fmt(result.score)} <span className="text-2xl text-[var(--muted)]">/ {result.maxScore}</span>
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {result.correct} correct · {result.wrong} wrong · {result.unanswered} not answered. Wrong MCQs lose
          1/3 of their marks; MSQ and NAT have no negative marking.
        </p>
        {!result.saved && (
          <p className="mt-2 text-xs text-[var(--muted)]">Sign in to keep a record of your scores.</p>
        )}
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-4 py-2">Question</th>
              <th className="px-4 py-2">Your answer</th>
              <th className="px-4 py-2">Official key</th>
              <th className="px-4 py-2 text-right">Marks</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => {
              const r = byId.get(q.id);
              const tone =
                r?.status === "correct"
                  ? "text-[var(--success)]"
                  : r?.status === "wrong"
                    ? "text-[var(--error)]"
                    : "text-[var(--muted)]";
              return (
                <tr key={q.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {questionLabel(q, continuous)} <span className="text-xs text-[var(--muted)]">{q.type}</span>
                  </td>
                  <td className="px-4 py-2 font-mono">{r?.answer ?? "—"}</td>
                  <td className="px-4 py-2 font-mono">{result.keys[q.id]}</td>
                  <td className={`px-4 py-2 text-right font-medium ${tone}`}>
                    {r && r.awarded > 0 ? "+" : ""}
                    {r ? fmt(r.awarded) : "0"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
