"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GATE_2027_EXAM_DAYS } from "@/content/syllabus-changes";
import { Card } from "@/components/ui";
import { DEFAULT_TIME_ZONE, dayKey } from "@/lib/stats";

/** Whole days from `today` (YYYY-MM-DD) to `target` (YYYY-MM-DD). */
export function daysBetween(today: string, target: string): number {
  return Math.round((Date.parse(`${target}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

const fmt = (key: string) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

/**
 * Days left until GATE 2027 (dates from the official brochure). Counts in
 * India time, since that's where the exam runs. Rendered on the client so the
 * number is never stale from a cached page.
 */
export function ExamCountdown({ compact = false }: { compact?: boolean }) {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(dayKey(new Date(), DEFAULT_TIME_ZONE)), []);

  const first = GATE_2027_EXAM_DAYS[0];
  const last = GATE_2027_EXAM_DAYS[GATE_2027_EXAM_DAYS.length - 1];
  const days = today ? daysBetween(today, first) : null;
  const during = today !== null && today >= first && today <= last;
  if (today !== null && today > last) return null;

  const headline =
    days === null ? "GATE 2027" : during ? "GATE 2027 is underway" : days === 1 ? "1 day to GATE 2027" : `${days} days to GATE 2027`;

  return (
    <Card className={compact ? "py-4" : ""}>
      <p className="kicker">Exam countdown</p>
      <p className={`mt-1 font-display ${compact ? "text-2xl" : "text-3xl"}`} aria-live="polite">
        {headline}
      </p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Exam days: {GATE_2027_EXAM_DAYS.map(fmt).join(", ")} 2027.{" "}
        <Link href="/syllabus-changes" className="text-[var(--accent)] hover:underline">
          What changed for 2027
        </Link>
      </p>
    </Card>
  );
}
