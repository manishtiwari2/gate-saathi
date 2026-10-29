import Link from "next/link";

const PLATFORM = [
  { href: "/pyqs", label: "PYQ Library" },
  { href: "/papers", label: "Official CS Papers" },
  { href: "/predicted-papers", label: "Mock Papers" },
  { href: "/daily", label: "Daily PYQ" },
  { href: "/rooms", label: "Study Rooms" },
  { href: "/doubts", label: "AI Tutor" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/syllabus-changes", label: "GATE 2027 changes" },
];

const LEGAL = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background-alt)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-lg font-semibold">GATE Saathi</p>
            <p className="mt-2 max-w-xs text-sm text-[var(--muted)]">
              GATE prep with friends: previous-year questions, practice papers, AI doubt help and
              study rooms to stay on track together.
            </p>
          </div>
          <FooterCol title="Platform" links={PLATFORM} />
          <FooterCol title="Legal" links={LEGAL} />
          <div>
            <p className="text-sm font-semibold">Support</p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Questions or feedback? Open an issue on{" "}
              <a
                href="https://github.com/manishtiwari2/gate-saathi/issues"
                className="text-[var(--accent)] hover:underline"
              >
                GitHub
              </a>
              .
            </p>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-[var(--border)] pt-6 text-sm text-[var(--muted)] sm:flex-row">
          <span>GATE Saathi. All rights reserved.</span>
          <span>Learn. Practice. Get feedback. Improve.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
