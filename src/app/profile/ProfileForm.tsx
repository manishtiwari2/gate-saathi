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
          <label className="mb-1 block text-sm font-medium">Email</label>
          <Input value={initial.email} disabled />
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
