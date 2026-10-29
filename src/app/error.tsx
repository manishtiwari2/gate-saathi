"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui";

/** Shown when a page throws while rendering (for example, a database error). */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-3xl">Something went wrong.</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        This page couldn&apos;t load. Please try again in a moment.
        {error.digest && <span className="block mt-1 font-mono text-xs">Reference: {error.digest}</span>}
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
