"use client";

import { useState } from "react";
import { Button, Card, Input } from "@/components/ui";

interface Props {
  initial: {
    displayName: string;
    username: string | null;
    dailyGoalMin: number;
    timezone: string;
    email: string;
    plan: string;
  };
}

export function ProfileForm({ initial }: Props) {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [username, setUsername] = useState(initial.username ?? "");
  const [dailyGoal, setDailyGoal] = useState(String(initial.dailyGoalMin));
  const [timezone, setTimezone] = useState(initial.timezone);
  // Every IANA zone the browser knows, with the saved one always present.
  const [zones] = useState(() => {
    const all = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
    return all.includes(initial.timezone) ? all : [initial.timezone, ...all];
  });
  const deviceZone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName,
          username: username || undefined,
          dailyGoalMin: Number(dailyGoal),
          timezone,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setStatus({ ok: false, msg: j?.error?.message ?? "Could not save." });
      } else {
        setStatus({ ok: true, msg: "Saved." });
      }
    } catch {
      setStatus({ ok: false, msg: "Something went wrong." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <Input id="email" value={initial.email} disabled />
        </div>
        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm font-medium">
            Display name
          </label>
          <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium">
            Username
          </label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="unique handle"
          />
        </div>
        <div>
          <label htmlFor="goal" className="mb-1 block text-sm font-medium">
            Daily study goal (minutes)
          </label>
          <Input
            id="goal"
            type="number"
            min={5}
            max={1440}
            value={dailyGoal}
            onChange={(e) => setDailyGoal(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="timezone" className="mb-1 block text-sm font-medium">
            Time zone
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Your day, streak and daily AI allowance reset at midnight here.
            {deviceZone && deviceZone !== timezone && (
              <>
                {" "}
                <button type="button" className="text-[var(--accent)] hover:underline" onClick={() => setTimezone(deviceZone)}>
                  Use this device&apos;s zone ({deviceZone.replace(/_/g, " ")})
                </button>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {status && (
            <span className={`text-sm ${status.ok ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
              {status.msg}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
