"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { QuestionBrowser } from "./QuestionBrowser";

interface SubjectItem {
  subjectName: string;
  displayName: string;
  questionCount: number;
  topicCount: number;
}

export function SubjectPicker({
  branchCode,
  subjects,
  initialSubject,
}: {
  branchCode: string;
  subjects: SubjectItem[];
  initialSubject?: string;
}) {
  const [selected, setSelected] = useState<string | null>(
    initialSubject && subjects.some((s) => s.subjectName === initialSubject) ? initialSubject : null,
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Subjects</h2>
        <ul className="mt-3 space-y-1">
          {subjects.map((s) => (
            <li key={s.subjectName}>
              <button
                onClick={() => setSelected(s.subjectName)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selected === s.subjectName
                    ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                    : "hover:bg-[var(--background-alt)]"
                }`}
              >
                <span>{s.displayName}</span>
                <span className="text-xs text-[var(--muted)]">{s.questionCount}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div>
        {selected ? (
          <QuestionBrowser branchCode={branchCode} subjectName={selected} />
        ) : (
          <Card className="flex min-h-[200px] flex-col items-center justify-center text-center">
            <p className="text-lg font-semibold">Pick a subject to start</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Choose a subject on the left to browse or quiz its previous-year questions.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
