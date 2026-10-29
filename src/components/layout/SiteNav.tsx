"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { cn, loginHref } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/pyqs", label: "PYQs" },
  { href: "/papers", label: "Past Papers" },
  { href: "/predicted-papers", label: "Mock Papers" },
  { href: "/doubts", label: "AI Tutor" },
  { href: "/predictor", label: "Predictor" },
  { href: "/cutoffs", label: "Cutoffs" },
  { href: "/library", label: "Library" },
  { href: "/rooms", label: "Rooms" },
  { href: "/dashboard", label: "Dashboard" },
];

/** Active for the section's own page and anything under it (/pyqs/cs → PYQs). */
function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user;
  const close = () => setOpen(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display text-xl font-semibold">
            GATE Saathi
          </Link>
          <div className="hidden items-center gap-6 whitespace-nowrap xl:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(pathname, l.href) ? "page" : undefined}
                className={cn(
                  "text-sm transition-colors hover:text-[var(--foreground)]",
                  isActive(pathname, l.href) ? "text-[var(--foreground)]" : "text-[var(--muted)]",
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-3 whitespace-nowrap xl:flex">
          <Link href="/daily" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
            Daily PYQ
          </Link>
          {status !== "loading" &&
            (user ? (
              <>
                <Link href="/profile" className="text-sm text-[var(--foreground)] hover:text-[var(--accent)]">
                  {user.name ?? "Profile"}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href={loginHref(pathname)}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
              >
                Sign In
              </Link>
            ))}
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 xl:hidden">
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
        <div className="border-t border-[var(--border)] bg-[var(--background)] xl:hidden">
          <div className="flex flex-col px-4 py-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                aria-current={isActive(pathname, l.href) ? "page" : undefined}
                className={cn(
                  "py-2 text-sm hover:text-[var(--foreground)]",
                  isActive(pathname, l.href) ? "text-[var(--foreground)]" : "text-[var(--muted)]",
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/daily" onClick={close} className="py-2 text-sm text-[var(--muted)]">
              Daily PYQ
            </Link>
            {status !== "loading" &&
              (user ? (
                <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-3">
                  <Link href="/profile" onClick={close} className="text-sm text-[var(--foreground)]">
                    {user.name ?? "Profile"}
                  </Link>
                  <button
                    onClick={() => {
                      close();
                      signOut({ callbackUrl: "/" });
                    }}
                    className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  href={loginHref(pathname)}
                  onClick={close}
                  className="mt-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-center text-sm font-medium text-[var(--accent-foreground)]"
                >
                  Sign In
                </Link>
              ))}
          </div>
        </div>
      )}
    </nav>
  );
}
