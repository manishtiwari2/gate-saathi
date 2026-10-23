"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui";
import type { Branch } from "@/lib/branches";

export interface BranchWithCount extends Branch {
  questionCount: number;
}

export function BranchGrid({ branches }: { branches: BranchWithCount[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter(
      (b) =>
        b.displayName.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q),
    );
  }, [branches, query]);

  return (
    <div>
      <div className="mx-auto max-w-md">
        <label htmlFor="branch-search" className="sr-only">
          Find a branch
        </label>
        <Input
          id="branch-search"
          type="search"
          placeholder="Find a branch: CS, Electrical, Civil…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[var(--muted)]">
          No branch matches “{query}”.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <li key={b.code}>
              <Link
                href={`/pyqs/${b.code}`}
                className="flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--border)] p-5 transition-colors hover:border-[var(--accent)]"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    {b.icon}
                  </span>
                  <span>
                    <span className="block font-medium">{b.displayName}</span>
                    <span className="block text-xs uppercase text-[var(--muted)]">{b.code}</span>
                  </span>
                </span>
                <span className="text-sm text-[var(--muted)]">{b.questionCount} PYQs</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
