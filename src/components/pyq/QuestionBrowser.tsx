"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card } from "@/components/ui";

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
type GradeState = { graded: boolean; isCorrect?: boolean; selected?: string };

export function QuestionBrowser({ branchCode, subjectName }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("browse");
  const [index, setIndex] = useState(0);
  const [grades, setGrades] = useState<Record<string, GradeState>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setIndex(0);
    setGrades({});
    fetch(`/api/pyq/questions?branch=${branchCode}&subject=${encodeURIComponent(subjectName)}&pageSize=100`)
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

  const grade = useCallback(async (q: Question, option: string) => {
    const res = await fetch("/api/pyq/attempts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ questionId: q.id, selectedAnswer: option }),
    });
    const j = await res.json().catch(() => null);
    const graded = Boolean(j?.data?.graded);
    const isCorrect = j?.data?.isCorrect;
    setGrades((g) => ({ ...g, [q.id]: { graded, isCorrect, selected: option } }));
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

  const shown = mode === "quiz" ? [questions[index]] : questions;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          {questions.length} question{questions.length === 1 ? "" : "s"} · {subjectName}
        </p>
        <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5">
          {(["browse", "quiz"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1 text-sm capitalize ${
                mode === m ? "bg-[var(--accent)] text-white" : "text-[var(--muted)]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {shown.map((q) => {
          const g = grades[q.id];
          return (
            <Card key={q.id}>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                {q.year && <Badge>GATE {q.year}</Badge>}
                <Badge>{q.questionType}</Badge>
                <Badge>{q.marks} mark{q.marks === 1 ? "" : "s"}</Badge>
                <span className="capitalize">{q.difficulty}</span>
                {q.topicName && <span>· {q.topicName}</span>}
              </div>
              <p className="mt-3 font-medium">{q.questionText}</p>

              {q.options.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {q.options.map((opt, i) => {
                    const chosen = g?.selected === opt;
                    const correct = g?.graded && g.isCorrect && chosen;
                    const wrong = g?.graded && g.isCorrect === false && chosen;
                    return (
                      <li key={i}>
                        <button
                          type="button"
                          disabled={mode === "quiz" && g?.graded}
                          onClick={() => grade(q, opt)}
                          className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
                            correct
                              ? "border-[var(--success)] bg-[var(--success)]/10"
                              : wrong
                                ? "border-[var(--error)] bg-[var(--error)]/10"
                                : "border-[var(--border)] hover:border-[var(--accent)]"
                          }`}
                        >
                          <span className="font-mono text-xs text-[var(--muted)]">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {g?.graded === false && (
                <p className="mt-3 text-xs text-[var(--muted)]">
                  Answer key not yet verified for this question.
                </p>
              )}
              {g?.graded && (
                <p className={`mt-3 text-sm font-medium ${g.isCorrect ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
                  {g.isCorrect ? "Correct!" : "Not quite — try another option."}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {mode === "quiz" && (
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="secondary"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-[var(--muted)]">
            {index + 1} / {questions.length}
          </span>
          <Button
            variant="secondary"
            disabled={index >= questions.length - 1}
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
