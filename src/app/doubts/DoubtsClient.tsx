"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Textarea } from "@/components/ui";
import { BRANCHES } from "@/lib/branches";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "answer"; text: string; remaining: number | null }
  | { kind: "coming-soon" }
  | { kind: "limit" }
  | { kind: "signin" }
  | { kind: "error"; message: string };

export function DoubtsClient() {
  const [question, setQuestion] = useState("");
  const [branch, setBranch] = useState("cs");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    fetch("/api/ai/doubt/free")
      .then((r) => r.json())
      .then((d) => {
        if (d.signedIn === false) return;
        setIsPremium(Boolean(d.isPremium));
        setRemaining(d.remaining ?? null);
      })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (question.trim().length < 3) return;
    setStatus({ kind: "loading" });
    try {
      const res = await fetch("/api/ai/doubt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, branch, subject: subject || undefined }),
      });
      if (res.status === 401) return setStatus({ kind: "signin" });
      if (res.status === 402) return setStatus({ kind: "limit" });
      const j = await res.json();
      if (!res.ok) return setStatus({ kind: "error", message: j?.error?.message ?? "Something went wrong." });
      if (j.available === false) return setStatus({ kind: "coming-soon" });
      setRemaining(j.remaining ?? remaining);
      setStatus({ kind: "answer", text: j.answer, remaining: j.remaining ?? null });
    } catch {
      setStatus({ kind: "error", message: "Network error. Please try again." });
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="q" className="mb-1 block text-sm font-medium">
              Your GATE doubt
            </label>
            <Textarea
              id="q"
              rows={5}
              placeholder="e.g. For a relation R(A,B,C,D,E) with FDs A→BC, B→D, C→E, what is the highest normal form?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="b" className="mb-1 block text-sm font-medium">
                Branch
              </label>
              <select
                id="b"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
              >
                {BRANCHES.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="s" className="mb-1 block text-sm font-medium">
                Subject (optional)
              </label>
              <input
                id="s"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. DBMS"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button type="submit" disabled={status.kind === "loading" || question.trim().length < 3}>
              {status.kind === "loading" ? "Thinking…" : "Ask the AI tutor"}
            </Button>
            {!isPremium && remaining !== null && (
              <span className="text-xs text-[var(--muted)]">{remaining} free left today</span>
            )}
            {isPremium && <span className="text-xs text-[var(--accent)]">Premium · unlimited</span>}
          </div>
        </form>
      </Card>

      <Card className="min-h-[200px]">
        {status.kind === "idle" && (
          <p className="text-sm text-[var(--muted)]">
            Ask any GATE question and get a step-by-step explanation grounded in concepts.
          </p>
        )}
        {status.kind === "loading" && (
          <div className="space-y-2" aria-busy>
            <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--background-alt)]" />
            <div className="h-4 w-full animate-pulse rounded bg-[var(--background-alt)]" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--background-alt)]" />
          </div>
        )}
        {status.kind === "answer" && (
          <div>
            <p className="kicker">Explanation</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{status.text}</p>
          </div>
        )}
        {status.kind === "coming-soon" && (
          <div className="text-center">
            <p className="text-4xl" aria-hidden>
              🚧
            </p>
            <h2 className="mt-3 text-lg font-semibold">AI Tutor is coming soon</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">
              The AI doubt engine isn&apos;t enabled on this deployment yet. Check back soon —
              everything else works in the meantime.
            </p>
          </div>
        )}
        {status.kind === "limit" && (
          <div className="text-center">
            <p className="text-4xl" aria-hidden>
              ⏳
            </p>
            <h2 className="mt-3 text-lg font-semibold">You&apos;ve used your 5 free doubts today</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Come back tomorrow, or upgrade to Premium for unlimited doubts.
            </p>
          </div>
        )}
        {status.kind === "signin" && (
          <div className="text-center">
            <h2 className="text-lg font-semibold">Sign in to ask a doubt</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              It&apos;s free — 5 AI doubts a day.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
            >
              Sign in
            </Link>
          </div>
        )}
        {status.kind === "error" && <p className="text-sm text-[var(--error)]">{status.message}</p>}
      </Card>
    </div>
  );
}
