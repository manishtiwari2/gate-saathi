"use client";

import type { SheetQuestion } from "@/lib/papers";

const LETTERS = ["A", "B", "C", "D"];

/**
 * Answer control for one official-paper question. Answers use option letters
 * (the question text is in the PDF): "B" for MCQ, "A;C" for MSQ, a number for NAT.
 */
export function AnswerInput({
  q,
  value,
  onChange,
  disabled,
  continuous = false,
}: {
  q: SheetQuestion;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  continuous?: boolean;
}) {
  const label = questionLabel(q, continuous);

  if (q.type === "NAT") {
    return (
      <div>
        <label htmlFor={`ans-${q.id}`} className="sr-only">
          Numerical answer for {label}
        </label>
        <input
          id={`ans-${q.id}`}
          inputMode="decimal"
          autoComplete="off"
          placeholder="Your answer"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.\-]/g, "").slice(0, 16))}
          className="w-36 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--accent)]"
        />
      </div>
    );
  }

  const selected = new Set(value ? value.split(";") : []);
  const toggle = (l: string) => {
    if (q.type === "MSQ") {
      const next = new Set(selected);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      onChange(LETTERS.filter((x) => next.has(x)).join(";"));
    } else {
      onChange(selected.has(l) ? "" : l); // tap again to clear
    }
  };

  return (
    <div role="group" aria-label={`${q.type === "MSQ" ? "Choose one or more options" : "Choose an option"} for ${label}`} className="flex gap-1.5">
      {LETTERS.map((l) => {
        const on = selected.has(l);
        return (
          <button
            key={l}
            type="button"
            disabled={disabled}
            aria-pressed={on}
            onClick={() => toggle(l)}
            className={`h-9 w-9 rounded-lg border text-sm font-medium transition-colors ${
              on
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "border-[var(--border)] hover:border-[var(--accent)]"
            } disabled:opacity-60`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

export function questionLabel(q: { section: string; number: number }, continuous = false) {
  return continuous ? `Q${q.number}` : `${q.section} Q${q.number}`;
}
