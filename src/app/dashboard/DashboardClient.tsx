"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";

interface Stats {
  total: { hours: number; minutes: number };
  sessions: number;
  dailyGoal: number;
  goalProgress: number;
  todayMinutes: number;
  streak: { current: number };
  recentDays: Array<{ date: string; minutes: number }>;
}

export function DashboardClient({ name }: { name: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/study/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStats(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-[var(--background-alt)]" />;
  }
  if (!stats) {
    return <Card>Could not load your stats. Please refresh.</Card>;
  }

  const maxMin = Math.max(1, ...stats.recentDays.map((d) => d.minutes));

  return (
    <div>
      <h1 className="font-display text-4xl">Welcome back, {name.split(" ")[0]}.</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Current streak" value={`${stats.streak.current} day${stats.streak.current === 1 ? "" : "s"}`} icon="🔥" />
        <Stat label="Total study time" value={`${stats.total.hours}h ${stats.total.minutes}m`} icon="⏱️" />
        <Stat label="Sessions" value={String(stats.sessions)} icon="📚" />
        <Stat label="Today" value={`${stats.todayMinutes} / ${stats.dailyGoal} min`} icon="🎯" />
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Daily goal</h2>
          <span className="text-sm text-[var(--muted)]">{stats.goalProgress}%</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--background-alt)]">
          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${stats.goalProgress}%` }} />
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-semibold">Last 30 days</h2>
        <div className="mt-4 flex h-32 items-end gap-1">
          {stats.recentDays.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.minutes} min`}
              className="flex-1 rounded-t bg-[var(--accent)]"
              style={{ height: `${Math.max(2, (d.minutes / maxMin) * 100)}%`, opacity: d.minutes ? 1 : 0.15 }}
            />
          ))}
        </div>
      </Card>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/leaderboard" className="text-[var(--accent)] hover:underline">
          View leaderboard →
        </Link>
        <Link href="/heatmap" className="text-[var(--accent)] hover:underline">
          Topic heatmap →
        </Link>
        <Link href="/rooms" className="text-[var(--accent)] hover:underline">
          Study rooms →
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <Card>
      <p className="text-2xl" aria-hidden>
        {icon}
      </p>
      <p className="mt-2 font-display text-2xl">{value}</p>
      <p className="text-sm text-[var(--muted)]">{label}</p>
    </Card>
  );
}
