"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import type { SheetQuestion } from "@/lib/papers";
import { AnswerInput, questionLabel } from "./AnswerInput";
import { PaperResults, type SubmitResult } from "./PaperResults";
import { useStoredState } from "./useStoredState";

type Check = { isCorrect: boolean; key: string | null; marksToAll: boolean } | { error: string };

/** Untimed practice: answer in any order, check single answers, or score the sheet. */
export function PaperPractice({
  paperId,
  questions,
  continuous,
}: {
  paperId: string;
  questions: SheetQuestion[];
  continuous: boolean;
}) {
  const [answers, setAnswers] = useStoredState<Record<string, string>>(`practice:${paperId}`, {});
  const [checks, setChecks] = useState<Record<string, Check>>({});
  const [section, setSection] = useState<"GA" | "CS">(continuous ? "CS" : "GA");
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shown = questions.filter((q) => q.section === section);
  const answered = questions.filter((q) => answers[q.id]).length;

  async function check(q: SheetQuestion) {
    const answer = answers[q.id];
    if (!answer) return;
    let next: Check;
    try {
      const r = await fetch(`/api/papers/${paperId}/check`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ section: q.section, number: q.number, answer }),
      });
      const j = await r.json().catch(() => null);
      next = r.ok
        ? j.data
        : { error: r.status === 429 ? "Too many checks. Wait a moment." : "Couldn't check this answer." };
    } catch {
      next = { error: "Network error. Please try again." };
    }
    setChecks((c) => ({ ...c, [q.id]: next }));
  }

  async function scoreSheet() {
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch(`/api/papers/${paperId}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "practice", answers }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) setError(j?.error?.message ?? "Couldn't score your answers.");
      else setResult(j.data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div>
        <Button variant="secondary" size="sm" className="mb-4" onClick={() => setResult(null)}>
          ← Back to the answer sheet
        </Button>
        <PaperResults result={result} questions={questions} continuous={continuous} />
      </div>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5" role="tablist">
          {(continuous ? (["CS", "GA"] as const) : (["GA", "CS"] as const)).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={section === s}
              onClick={() => setSection(s)}
              className={`rounded-md px-3 py-1 text-sm ${
                section === s ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted)]"
              }`}
            >
              {s === "GA" ? "General Aptitude" : "Computer Science"}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--muted)]">
          {answered} / {questions.length} answered
        </span>
      </div>

      <ol className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        {shown.map((q) => {
          const c = checks[q.id];
          return (
            <li key={q.id} className="border-b border-[var(--border)] pb-3 last:border-0">
              <p className="text-sm font-medium">
                {questionLabel(q, continuous)}{" "}
                <span className="text-xs font-normal text-[var(--muted)]">
                  · {q.marks} mark{q.marks === 1 ? "" : "s"} · {q.type}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <AnswerInput
                  q={q}
                  continuous={continuous}
                  value={answers[q.id] ?? ""}
                  onChange={(v) => {
                    setAnswers((a) => ({ ...a, [q.id]: v }));
                    setChecks(({ [q.id]: _drop, ...rest }) => (void _drop, rest));
                  }}
                />
                <Button size="sm" variant="secondary" disabled={!answers[q.id]} onClick={() => check(q)}>
                  Check
                </Button>
              </div>
              <p aria-live="polite" className="mt-1 text-xs">
                {c && "error" in c && <span className="text-[var(--error)]">{c.error}</span>}
                {c && !("error" in c) && (
                  <span className={c.isCorrect ? "text-[var(--success)]" : "text-[var(--error)]"}>
                    {c.marksToAll
                      ? "Marks to all: GATE gave every candidate full marks for this question."
                      : c.isCorrect
                        ? `Correct. Official key: ${c.key}`
                        : `Not quite. Official key: ${c.key}`}
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
        <Button onClick={scoreSheet} disabled={submitting || answered === 0}>
          {submitting ? "Scoring…" : "Score my answers"}
        </Button>
        <button
          type="button"
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          onClick={() => {
            if (confirm("Clear all your answers for this paper?")) {
              setAnswers({});
              setChecks({});
            }
          }}
        >
          Clear answers
        </button>
        {error && <p className="w-full text-sm text-[var(--error)]">{error}</p>}
      </div>
    </Card>
  );
}
