"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button, Card, Input } from "@/components/ui";

export function LoginForm({ googleEnabled, devEnabled }: { googleEnabled: boolean; devEnabled: boolean }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function devLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signIn("dev", { email, name, callbackUrl: "/dashboard" });
  }

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="font-display text-2xl">Log in or sign up</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Free to start. No card required.</p>

      {googleEnabled && (
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--background-alt)]"
        >
          <span aria-hidden>🔑</span> Continue with Google
        </button>
      )}

      {googleEnabled && devEnabled && (
        <div className="my-6 flex items-center gap-3 text-xs text-[var(--muted)]">
          <span className="h-px flex-1 bg-[var(--border)]" /> or <span className="h-px flex-1 bg-[var(--border)]" />
        </div>
      )}

      {devEnabled && (
        <form onSubmit={devLogin} className="mt-6 space-y-3">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Display name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in…" : "Continue"}
          </Button>
          <p className="text-xs text-[var(--muted)]">
            Dev login for local use. Configure Google OAuth to enable real sign-in.
          </p>
        </form>
      )}

      {!googleEnabled && !devEnabled && (
        <p className="mt-6 text-sm text-[var(--muted)]">
          Sign-in is not configured yet. Add Google OAuth credentials or enable dev login.
        </p>
      )}
    </Card>
  );
}
