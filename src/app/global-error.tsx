"use client";

/**
 * Last-resort error page for failures in the root layout itself. It replaces
 * the whole document, so it can't rely on the layout's fonts or theme script.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#faf8f5", color: "#1a1a1a", textAlign: "center", padding: "4rem 1rem" }}>
        <h1>Something went wrong.</h1>
        <p>GATE Saathi couldn&apos;t load. Please try again.</p>
        <button onClick={reset} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
