"use client";

import { useMemo, useState } from "react";
import { BRANCHES } from "@/lib/branches";

export interface CutoffRow {
  year: number;
  branchCode: string;
  branchName: string;
  generalCutoff: number | null;
  obCutoff: number | null;
  scCutoff: number | null;
  stCutoff: number | null;
  totalApplicants: number | null;
  totalQualified: number | null;
  qualifyingRate: number | null;
}

export function CutoffTable({ rows }: { rows: CutoffRow[] }) {
  const years = useMemo(() => [...new Set(rows.map((r) => r.year))].sort((a, b) => b - a), [rows]);
  const [branch, setBranch] = useState("all");
  const [year, setYear] = useState("all");

  const filtered = rows.filter(
    (r) =>
      (branch === "all" || r.branchCode.toLowerCase() === branch) &&
      (year === "all" || r.year === Number(year)),
  );

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <select
          aria-label="Filter by branch"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
        >
          <option value="all">All branches</option>
          {BRANCHES.map((b) => (
            <option key={b.code} value={b.code}>
              {b.displayName}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
        >
          <option value="all">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--background-alt)] text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3 text-right">General</th>
              <th className="px-4 py-3 text-right">OBC</th>
              <th className="px-4 py-3 text-right">SC</th>
              <th className="px-4 py-3 text-right">ST</th>
              <th className="px-4 py-3 text-right">Qualified</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">
                  No cutoff data for this selection.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={`${r.year}-${r.branchCode}`} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3">{r.year}</td>
                  <td className="px-4 py-3">{r.branchCode}</td>
                  <td className="px-4 py-3 text-right">{r.generalCutoff ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{r.obCutoff ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{r.scCutoff ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{r.stCutoff ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {r.totalQualified ? r.totalQualified.toLocaleString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
