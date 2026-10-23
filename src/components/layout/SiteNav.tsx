"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/pyqs", label: "PYQs" },
  { href: "/predicted-papers", label: "Mock Papers" },
  { href: "/doubts", label: "AI Tutor" },
  { href: "/predictor", label: "Predictor" },
  { href: "/cutoffs", label: "Cutoffs" },
  { href: "/library", label: "Library" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display text-xl font-semibold">
            GATE Saathi
          </Link>
          <div className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "text-sm transition-colors hover:text-[var(--foreground)]",
                  pathname === l.href ? "text-[var(--foreground)]" : "text-[var(--muted)]",
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/daily" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
            Daily PYQ
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            Sign In
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--foreground)] hover:bg-[var(--background-alt)]"
          >
            <span aria-hidden>{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[var(--border)] bg-[var(--background)] lg:hidden">
          <div className="flex flex-col px-4 py-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                {l.label}
              </Link>
            ))}
            <Link href="/daily" onClick={() => setOpen(false)} className="py-2 text-sm text-[var(--muted)]">
              Daily PYQ
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-center text-sm font-medium text-white"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
