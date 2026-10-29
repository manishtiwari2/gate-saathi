"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Input } from "@/components/ui";

interface Question {
  id: string;
  questionNumber: string | null;
  subjectName: string;
  topicName: string | null;
  questionType: string;
  marks: number;
  difficulty: string;
  year: number | null;
  questionText: string;
  options: string[];
  answerVerified: boolean;
}

interface Props {
  branchCode: string;
  subjectName: string;
}

type Mode = "browse" | "quiz";
type GradeState =
  | { status: "checking"; selected: string }
  | { status: "graded"; isCorrect: boolean; selected: string }
  | { status: "unverified"; selected: string }
  | { status: "error"; message: string; selected: string };

const letter = (i: number) => String.fromCharCode(65 + i);

export function QuestionBrowser({ branchCode, subjectName }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("browse");
  const [year, setYear] = useState<string>("all");
  const [index, setIndex] = useState(0);
  const [grades, setGrades] = useState<Record<string, GradeState>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setIndex(0);
    setYear("all");
    setGrades({});
    fetch(`/api/pyq/questions?branch=${branchCode}&subject=${encodeURIComponent(subjectName)}&pageSize=200`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (active) setQuestions(d.data ?? []);
      })
      .catch(() => active && setError("Could not load questions. Please try again."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [branchCode, subjectName]);

  const years = useMemo(
    () => [...new Set(questions.map((q) => q.year).filter((y): y is number => y != null))].sort((a, b) => b - a),
    [questions],
  );
  const filtered = useMemo(
    () => (year === "all" ? questions : questions.filter((q) => String(q.year) === year)),
    [questions, year],
  );
  const verifiedCount = useMemo(() => filtered.filter((q) => q.answerVerified).length, [filtered]);

  const grade = useCallback(async (q: Question, answer: string) => {
    setGrades((g) => ({ ...g, [q.id]: { status: "checking", selected: answer } }));
    let next: GradeState;
    try {
      const res = await fetch("/api/pyq/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: q.id, selectedAnswer: answer }),
      });
      const j = await res.json().catch(() => null);
      if (res.status === 429) {
        next = { status: "error", message: "You're checking answers very quickly. Wait a moment and try again.", selected: answer };
      } else if (!res.ok) {
        next = { status: "error", message: "Couldn't check your answer. Please try again.", selected: answer };
      } else if (j?.data?.graded) {
        next = { status: "graded", isCorrect: Boolean(j.data.isCorrect), selected: answer };
      } else {
        next = { status: "unverified", selected: answer };
      }
    } catch {
      next = { status: "error", message: "Network error. Please try again.", selected: answer };
    }
    setGrades((g) => ({ ...g, [q.id]: next }));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4" aria-busy>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-[var(--radius-card)] bg-[var(--background-alt)]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center">
        <p className="text-[var(--error)]">{error}</p>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-[var(--muted)]">No questions available for {subjectName} yet.</p>
      </Card>
    );
  }

  const current = Math.min(index, filtered.length - 1);
  const shown = mode === "quiz" ? [filtered[current]] : filtered;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-[var(--muted)]">
          <p>
            {filtered.length} question{filtered.length === 1 ? "" : "s"} · {subjectName}
          </p>
          <p className="text-xs">
            {verifiedCount} of {filtered.length} have a verified answer key
          </p>
        </div>
        <div className="flex items-center gap-3">
          {years.length > 1 && (
            <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <span>Year</span>
              <select
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  setIndex(0);
                }}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--foreground)]"
              >
                <option value="all">All years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    GATE {y}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5" role="group" aria-label="View mode">
            {(["browse", "quiz"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`rounded-md px-3 py-1 text-sm capitalize ${
                  mode === m ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted)]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {shown.map((q) => (
          <QuestionCard
            key={q.id}
            q={q}
            branchCode={branchCode}
            state={grades[q.id]}
            lockAfterGrade={mode === "quiz"}
            onSubmit={(answer) => grade(q, answer)}
          />
        ))}
      </div>

      {mode === "quiz" && (
        <div className="mt-6 flex items-center justify-between">
          <Button variant="secondary" disabled={current === 0} onClick={() => setIndex(Math.max(0, current - 1))}>
            Previous
          </Button>
          <span className="text-sm text-[var(--muted)]">
            {current + 1} / {filtered.length}
          </span>
          <Button
            variant="secondary"
            disabled={current >= filtered.length - 1}
            onClick={() => setIndex(Math.min(filtered.length - 1, current + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  q,
  branchCode,
  state,
  lockAfterGrade,
  onSubmit,
}: {
  q: Question;
  branchCode: string;
  state: GradeState | undefined;
  lockAfterGrade: boolean;
  onSubmit: (answer: string) => void;
}) {
  const type = q.questionType.toUpperCase();
  const [natValue, setNatValue] = useState("");
  const [msq, setMsq] = useState<number[]>([]);
  const graded = state?.status === "graded";
  const locked = state?.status === "checking" || (lockAfterGrade && graded);

  const askAiHref = `/doubts?${new URLSearchParams({
    branch: branchCode,
    subject: q.subjectName,
    q: [
      `GATE ${q.year ?? ""} ${type} question:`,
      q.questionText,
      ...q.options.map((o, i) => `(${letter(i)}) ${o}`),
    ]
      .join("\n")
      .slice(0, 3500),
  })}`;

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
        {q.year && <Badge>GATE {q.year}</Badge>}
        {q.questionNumber && <span>Q{q.questionNumber}</span>}
        <Badge>{type}</Badge>
        <Badge>
          {q.marks} mark{q.marks === 1 ? "" : "s"}
        </Badge>
        {q.topicName && <span>· {q.topicName}</span>}
        {!q.answerVerified && <span className="italic">· answer key not yet verified</span>}
      </div>
      <p className="mt-3 whitespace-pre-line font-medium">{q.questionText}</p>

      {type === "NAT" ? (
        <form
          className="mt-4 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (natValue.trim()) onSubmit(natValue.trim());
          }}
        >
          <label className="sr-only" htmlFor={`nat-${q.id}`}>
            Your numerical answer
          </label>
          <Input
            id={`nat-${q.id}`}
            inputMode="decimal"
            placeholder="Your answer"
            value={natValue}
            onChange={(e) => setNatValue(e.target.value)}
            disabled={locked}
            className="max-w-[12rem]"
          />
          <Button type="submit" size="sm" disabled={locked || !natValue.trim()}>
            Check
          </Button>
        </form>
      ) : (
        q.options.length > 0 && (
          <ul className="mt-4 space-y-2">
            {q.options.map((opt, i) => {
              const l = letter(i);
              const chosen =
                type === "MSQ" ? msq.includes(i) : state?.selected === l;
              const correct = graded && state.isCorrect && (type === "MSQ" ? chosen : state.selected === l);
              const wrong = graded && !state.isCorrect && (type === "MSQ" ? chosen : state.selected === l);
              return (
                <li key={i}>
                  <button
                    type="button"
                    disabled={locked}
                    aria-pressed={chosen}
                    onClick={() =>
                      type === "MSQ"
                        ? setMsq((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))
                        : onSubmit(l)
                    }
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
                      correct
                        ? "border-[var(--success)] bg-[var(--success)]/10"
                        : wrong
                          ? "border-[var(--error)] bg-[var(--error)]/10"
                          : chosen
                            ? "border-[var(--accent)]"
                            : "border-[var(--border)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <span className="font-mono text-xs text-[var(--muted)]">{l}</span>
                    <span>{opt}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )
      )}

      {type === "MSQ" && (
        <div className="mt-3">
          <Button
            size="sm"
            disabled={locked || msq.length === 0}
            onClick={() => onSubmit([...msq].sort().map(letter).join(";"))}
          >
            Check selection
          </Button>
        </div>
      )}

      <div aria-live="polite" className="mt-3 text-sm">
        {state?.status === "checking" && <p className="text-[var(--muted)]">Checking…</p>}
        {state?.status === "unverified" && (
          <p className="text-xs text-[var(--muted)]">
            The answer key for this question isn&apos;t verified yet, so it can&apos;t be graded.
          </p>
        )}
        {state?.status === "error" && <p className="text-[var(--error)]">{state.message}</p>}
        {graded && (
          <p className={`font-medium ${state.isCorrect ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
            {state.isCorrect ? "Correct!" : "Not quite. Try again or ask the AI tutor."}
          </p>
        )}
      </div>

      <div className="mt-3">
        <Link href={askAiHref} className="text-xs text-[var(--accent)] hover:underline">
          Ask the AI tutor about this question →
        </Link>
      </div>
    </Card>
  );
}
