"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { PAPER_MINUTES, type SheetQuestion } from "@/lib/papers";
import { formatDuration } from "@/lib/utils";
import { AnswerInput, questionLabel } from "./AnswerInput";
import { PaperResults, type SubmitResult } from "./PaperResults";
import { PaperViewer } from "./PaperViewer";
import { useStoredState } from "./useStoredState";

interface MockState {
  startedAt: number | null;
  answers: Record<string, string>;
  marked: string[]; // "mark for review", as in the real exam
  result: SubmitResult | null;
}

const EMPTY: MockState = { startedAt: null, answers: {}, marked: [], result: null };
const LIMIT_MS = PAPER_MINUTES * 60_000;

/**
 * Timed mock with the real exam's shape: 180 minutes, a question palette,
 * mark-for-review, auto-submit when time runs out, then GATE-marked results.
 * Progress survives a refresh (stored in the browser).
 */
export function PaperMock({
  paperId,
  title,
  pdfPath,
  questions,
  continuous,
  signedIn,
}: {
  paperId: string;
  title: string;
  pdfPath: string;
  questions: SheetQuestion[];
  continuous: boolean;
  signedIn: boolean;
}) {
  const [state, setState, ready] = useStoredState<MockState>(`mock:${paperId}`, EMPTY);
  const [current, setCurrent] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittedRef = useRef(false);

  const running = state.startedAt !== null && !state.result;
  const remaining = state.startedAt ? Math.max(0, state.startedAt + LIMIT_MS - now) : LIMIT_MS;

  useEffect(() => {
    if (!running) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [running]);

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch(`/api/papers/${paperId}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "mock",
          answers: state.answers,
          durationSec: state.startedAt ? Math.round(Math.min(Date.now() - state.startedAt, LIMIT_MS) / 1000) : undefined,
        }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        setError(j?.error?.message ?? "Couldn't submit. Your answers are kept; try again.");
        submittedRef.current = false;
      } else {
        setState((s) => ({ ...s, result: j.data }));
      }
    } catch {
      setError("Network error. Your answers are kept; try again.");
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [paperId, setState, state.answers, state.startedAt]);

  // Time's up: submit automatically, like the real exam.
  useEffect(() => {
    if (running && remaining === 0) void submit();
  }, [running, remaining, submit]);

  if (!ready) return null;

  if (state.result) {
    return (
      <div>
        <div className="mb-4 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              if (!confirm("Start this paper again? Your current result will be cleared from this page.")) return;
              submittedRef.current = false;
              setState(EMPTY);
              setCurrent(0);
            }}
          >
            Retake this paper
          </Button>
          <Link href={`/papers/${paperId}`} className="self-center text-sm text-[var(--accent)] hover:underline">
            Practise it untimed instead
          </Link>
        </div>
        <PaperResults result={state.result} questions={questions} continuous={continuous} />
      </div>
    );
  }

  if (!state.startedAt) {
    return (
      <Card className="max-w-2xl">
        <h2 className="font-display text-2xl">Before you start</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
          <li>{PAPER_MINUTES} minutes for {questions.length} questions, as in the real exam. The paper submits itself when time runs out.</li>
          <li>Read the questions in the official PDF; mark your answers in the answer sheet beside it.</li>
          <li>Wrong MCQs lose 1/3 of their marks (1/3 or 2/3). MSQ and NAT have no negative marking.</li>
          <li>Your progress is kept if you refresh this page on this device.</li>
        </ul>
        {!signedIn && (
          <p className="mt-3 text-xs text-[var(--muted)]">
            You&apos;re not signed in: you&apos;ll see your score, but it won&apos;t be saved to your account.
          </p>
        )}
        <Button className="mt-5" onClick={() => { setNow(Date.now()); setState({ ...EMPTY, startedAt: Date.now() }); }}>
          Start the {PAPER_MINUTES}-minute test
        </Button>
      </Card>
    );
  }

  const q = questions[current];
  const answered = questions.filter((x) => state.answers[x.id]).length;
  const marked = new Set(state.marked);
  const low = remaining < 10 * 60_000;

  return (
    <div>
      <div className="sticky top-16 z-40 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--background)] px-4 py-3 sm:-mx-6 sm:px-6">
        <span className="font-semibold">{title}</span>
        <span className={`font-mono text-lg tabular-nums ${low ? "text-[var(--error)]" : ""}`} aria-live="off">
          ⏱ {formatDuration(Math.ceil(remaining / 1000))}
        </span>
        <span className="text-sm text-[var(--muted)]">
          {answered}/{questions.length} answered
        </span>
        <Button
          disabled={submitting}
          onClick={() => {
            const left = questions.length - answered;
            if (confirm(left > 0 ? `${left} question(s) are unanswered. Submit anyway?` : "Submit your test?")) void submit();
          }}
        >
          {submitting ? "Submitting…" : "Submit test"}
        </Button>
        {error && <p className="w-full text-sm text-[var(--error)]">{error}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <PaperViewer pdfPath={pdfPath} title={title} />

        <div className="space-y-4">
          <Card>
            <p className="text-sm font-medium">
              {questionLabel(q, continuous)}{" "}
              <span className="text-xs font-normal text-[var(--muted)]">
                · {q.marks} mark{q.marks === 1 ? "" : "s"} · {q.type}
                {q.type === "MSQ" && " (one or more correct)"}
              </span>
            </p>
            <div className="mt-3">
              <AnswerInput
                q={q}
                value={state.answers[q.id] ?? ""}
                onChange={(v) => setState((s) => ({ ...s, answers: { ...s.answers, [q.id]: v } }))}
                continuous={continuous}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                aria-pressed={marked.has(q.id)}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    marked: marked.has(q.id) ? s.marked.filter((x) => x !== q.id) : [...s.marked, q.id],
                  }))
                }
              >
                {marked.has(q.id) ? "Unmark review" : "Mark for review"}
              </Button>
              <Button
                size="sm"
                disabled={current === questions.length - 1}
                onClick={() => setCurrent(current + 1)}
              >
                Next
              </Button>
            </div>
          </Card>

          <Card>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Question palette</p>
            <div className="mt-3 grid grid-cols-8 gap-1.5" role="list">
              {questions.map((x, i) => {
                const isAnswered = Boolean(state.answers[x.id]);
                const isMarked = marked.has(x.id);
                return (
                  <button
                    key={x.id}
                    role="listitem"
                    onClick={() => setCurrent(i)}
                    aria-current={i === current}
                    aria-label={`${questionLabel(x, continuous)}${isAnswered ? ", answered" : ""}${isMarked ? ", marked for review" : ""}`}
                    className={`h-8 rounded text-xs tabular-nums ${
                      i === current ? "ring-2 ring-[var(--accent)]" : ""
                    } ${
                      isMarked
                        ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                        : isAnswered
                          ? "bg-[var(--success)] text-[var(--background)]"
                          : "border border-[var(--border)]"
                    }`}
                  >
                    {continuous || x.section === "CS" ? x.number : `G${x.number}`}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-[var(--muted)]">
              Green: answered · Tinted: marked for review · G1–G10: General Aptitude
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
