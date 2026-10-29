"use client";

import { useEffect, useState } from "react";

/**
 * useState that survives a page refresh via localStorage. Storage can be
 * unavailable (private mode, blocked site data), so every access is guarded
 * and the state still works in memory. `ready` turns true once any saved
 * value has been restored.
 */
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [key]);

  // Save only after restoring, so the initial value never overwrites saved data.
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value, ready]);

  return [value, setValue, ready] as const;
}
