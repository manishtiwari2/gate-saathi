"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface SessionUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  plan: string;
}

type SessionState = { user: SessionUser | null; status: "loading" | "ready" };

const SessionContext = createContext<SessionState>({ user: null, status: "loading" });

/** Who is signed in, for client components such as the nav. */
export const useSessionUser = () => useContext(SessionContext);

/**
 * Fetches the signed-in user once per page load. Signing in and out both
 * end in a full page load, so this never goes stale.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ user: null, status: "loading" });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .catch(() => ({ user: null }))
      .then((d: { user: SessionUser | null }) => setState({ user: d.user, status: "ready" }));
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

/** Sign out everywhere (Supabase session and dev login), then go home. */
export async function signOut() {
  await fetch("/api/auth/signout", { method: "POST" }).catch(() => {});
  window.location.assign("/");
}
