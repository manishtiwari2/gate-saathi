"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button, Card, Input } from "@/components/ui";

const ERRORS: Record<string, string> = {
  signin: "Sign-in didn't finish. Please try again.",
  email: "Your account has no verified email. Verify it with the provider, then try again.",
};

const PROVIDERS = [
  { id: "google", label: "Continue with Google", icon: "🔑" },
  { id: "github", label: "Continue with GitHub", icon: "🐙" },
] as const;

export function LoginForm({
  oauthEnabled,
  devEnabled,
  callbackUrl,
  error: errorCode,
}: {
  oauthEnabled: boolean;
  devEnabled: boolean;
  callbackUrl: string;
  error?: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorCode ? (ERRORS[errorCode] ?? ERRORS.signin) : null);

  async function oauth(provider: (typeof PROVIDERS)[number]["id"]) {
    setLoading(true);
    setError(null);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    // On success the browser is already leaving for the provider.
    if (error) {
      setError(ERRORS.signin);
      setLoading(false);
    }
  }

  async function devLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const r = await fetch("/api/auth/dev", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, name }),
    }).catch(() => null);
    if (r?.ok) {
      window.location.assign(callbackUrl);
    } else {
      setError("Couldn't sign in. Check the email and try again.");
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="font-display text-2xl">Log in or sign up</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Free to start. No card required.</p>

      {error && (
        <p role="alert" className="mt-4 text-sm text-[var(--error)]">
          {error}
        </p>
      )}

      {oauthEnabled && (
        <div className="mt-6 space-y-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={loading}
              onClick={() => oauth(p.id)}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--background-alt)] disabled:opacity-60"
            >
              <span aria-hidden>{p.icon}</span> {p.label}
            </button>
          ))}
        </div>
      )}

      {oauthEnabled && devEnabled && (
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
            Dev login for local use. Configure Supabase Auth to enable Google and GitHub sign-in.
          </p>
        </form>
      )}

      {!oauthEnabled && !devEnabled && (
        <p className="mt-6 text-sm text-[var(--muted)]">
          Sign-in is coming soon.
        </p>
      )}
    </Card>
  );
}
