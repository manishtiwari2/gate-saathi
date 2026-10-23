"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui";
import { SYLLABUS_CHANGES } from "@/content/syllabus-changes";

const STORAGE_KEY = "syllabus-reviewed";

export function Checklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      /* storage unavailable */
    }
  }, []);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const reviewed = SYLLABUS_CHANGES.filter((c) => checked[c.id]).length;

  return (
    <div>
      <p className="text-sm text-[var(--muted)]">
        {reviewed} of {SYLLABUS_CHANGES.length} reviewed
      </p>
      <ul className="mt-4 space-y-3">
        {SYLLABUS_CHANGES.map((c) => (
          <li key={c.id}>
            <label className="flex cursor-pointer gap-3 rounded-[var(--radius-card)] border border-[var(--border)] p-4">
              <input
                type="checkbox"
                checked={Boolean(checked[c.id])}
                onChange={() => toggle(c.id)}
                className="mt-1 h-4 w-4 accent-[var(--accent)]"
              />
              <span className="flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  {c.tags.map((t) => (
                    <Badge key={t} tone="accent">
                      {t}
                    </Badge>
                  ))}
                  <span className="text-xs uppercase text-[var(--muted)]">{c.category}</span>
                </span>
                <span className="mt-2 block font-medium">{c.title}</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">{c.detail}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
