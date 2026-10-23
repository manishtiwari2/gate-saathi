"use client";

import { useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { BRANCHES } from "@/lib/branches";

interface Result {
  branch: string;
  marks: number;
  basedOnYear: number;
  estimatedRank: number;
  rankLow: number;
  rankHigh: number;
  percentile: number;
  qualifies: boolean;
}

export function PredictorForm() {
  const [marks, setMarks] = useState("");
  const [branch, setBranch] = useState("cs");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const m = Number(marks);
    if (Number.isNaN(m) || m < 0 || m > 100) {
      setError("Enter marks between 0 and 100.");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`/api/predictor?branch=${branch}&marks=${m}`);
      const j = await r.json();
      if (!r.ok) {
        setError(j?.error?.message ?? "Could not estimate rank.");
        return;
      }
      setResult(j);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="marks" className="mb-1 block text-sm font-medium">
              Your expected marks (out of 100)
            </label>
            <Input
              id="marks"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="0.01"
              placeholder="e.g., 65"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="branch" className="mb-1 block text-sm font-medium">
              Branch
            </label>
            <select
              id="branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm"
            >
              {BRANCHES.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.displayName} ({b.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Estimating…" : "Estimate my rank"}
          </Button>
          {error && <p className="text-sm text-[var(--error)]">{error}</p>}
        </form>
      </Card>

      <Card className="flex flex-col justify-center">
        {result ? (
          <div>
            <p className="kicker">Estimated All India Rank</p>
            <p className="mt-2 font-display text-5xl">
              {result.rankLow.toLocaleString()}–{result.rankHigh.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Point estimate ~{result.estimatedRank.toLocaleString()} · around the{" "}
              {result.percentile.toFixed(1)}th percentile.
            </p>
            <p className="mt-4 text-sm">
              {result.qualifies ? (
                <span className="text-[var(--success)]">Likely above the qualifying cutoff.</span>
              ) : (
                <span className="text-[var(--error)]">Below the typical qualifying cutoff.</span>
              )}
            </p>
            <p className="mt-6 text-xs text-[var(--muted)]">
              Estimate based on {result.branch} statistics from GATE {result.basedOnYear}. The real
              score-to-rank mapping is published only after results; treat this as a guide, not a
              guarantee.
            </p>
          </div>
        ) : (
          <p className="text-center text-sm text-[var(--muted)]">
            Enter your marks to see an estimated rank range.
          </p>
        )}
      </Card>
    </div>
  );
}
