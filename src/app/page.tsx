import Link from "next/link";
import { ExamCountdown } from "@/components/ExamCountdown";
import { ButtonLink, Card, Kicker } from "@/components/ui";
import { ExampleRoomCard } from "@/components/home/ExampleRoomCard";
import { BRANCHES } from "@/lib/branches";

const STEPS = [
  { n: "01", title: "Create a room", body: "Start a private study room in a few seconds. Each room gets a short room key." },
  { n: "02", title: "Share the key", body: "Send the key to your friends. They join from the Rooms page and appear in your member list." },
  { n: "03", title: "Study together", body: "Start your focus timer next to your friends, see who is active, and talk through doubts in the room chat." },
];

const FEATURES = [
  { href: "/rooms", title: "Private study rooms", body: "Invite-only rooms joined with a room key. A focus timer, chat and member list in one place." },
  { href: "/library", title: "Virtual library", body: "Walk into a shared study world with a reading area, quiet zone and group tables. Free with an account." },
  { href: "/leaderboard", title: "Leaderboard", body: "See where you and your friends rank by study time logged with the focus timer." },
  { href: "/dashboard", title: "Streaks and daily goals", body: "Set a daily study goal and keep your streak going. Your dashboard shows the days you showed up." },
  { href: "/rooms", title: "Group chat", body: "Every room has its own chat for quick questions. Premium adds a global study chat with all aspirants." },
  { href: "/storage", title: "Personal storage", body: "Keep your notes and PDFs in private storage, up to 20 MB per file. Sharing files into rooms is coming soon." },
];

const TOOLS = [
  { href: "/pyqs", title: "PYQ library", body: "Previous-year questions organized by branch, subject and topic. Practice in browse or quiz mode. Free." },
  { href: "/doubts", title: "AI doubt engine", body: "Step-by-step explanations for GATE doubts. 5 questions a day free, unlimited on Premium." },
  { href: "/predicted-papers", title: "Trend-based mock papers", body: "4 practice papers per branch, modelled on historical question patterns. Preview each paper's structure free; full attempts are coming soon." },
];

const FAQS = [
  { q: "Is GATE Saathi free?", a: "Yes. The PYQ library, study rooms, predictor and cutoffs are free to use. Premium adds unlimited AI doubts, the global study chat and the topic heatmap." },
  { q: "How do study rooms work?", a: "Create a private room and you get a short room key. Share it with friends; they join from the Rooms page. Each room has a focus timer, chat and a member list showing who's online." },
  { q: "Which GATE branches are covered?", a: "20 GATE branches have PYQs and mock-paper outlines, and Data Science & AI is listed with its questions still to come. Question coverage varies by branch." },
  { q: "Are the mock papers real predictions of the GATE paper?", a: "No. They are practice simulations modelled on historical question patterns, not predictions of the actual paper." },
  { q: "Does it work on Android?", a: "Yes. The site is responsive and works in any modern mobile browser." },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-fade-in">
            <Kicker>Your study group, online</Kicker>
            <h1 className="mt-4 font-display text-5xl leading-tight lg:text-6xl">
              Study for GATE with your friends.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-[var(--muted)]">
              Open a private study room, share the key, and put in the hours together. Focus timers
              and room chat sit right next to each other, with PYQs, the rank predictor and cutoffs
              built in.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/rooms" size="lg">Create a study room</ButtonLink>
              <ButtonLink href="/library" variant="secondary" size="lg">Enter the virtual library</ButtonLink>
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">
              Just here for questions?{" "}
              <Link href="/pyqs" className="text-[var(--accent)] hover:underline">Browse the free PYQ library</Link>
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
              <li>✓ Free to start, no card required</li>
              <li>✓ Private rooms with a room key</li>
              <li>✓ PYQs across 20 GATE branches, coverage varies</li>
            </ul>
            <div className="mt-6 max-w-md">
              <ExamCountdown compact />
            </div>
          </div>
          <ExampleRoomCard />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[var(--border)] bg-[var(--background-alt)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <Kicker>How it works</Kicker>
          <h2 className="mt-3 font-display text-4xl">Studying together, in three steps.</h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            No group calls to schedule. Open a room when you sit down to study and your friends can join you.
          </p>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n}>
                <Card>
                  <span aria-hidden className="font-display text-3xl text-[var(--accent)]">{s.n}</span>
                  <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">{s.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Together features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Kicker>Together</Kicker>
        <h2 className="mt-3 font-display text-4xl">Built for studying with people you know.</h2>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title}>
              <Link href={f.href} className="block h-full">
                <Card className="h-full transition-colors hover:border-[var(--accent)]">
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">{f.body}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* GATE tools */}
      <section className="border-t border-[var(--border)] bg-[var(--background-alt)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <Kicker>GATE prep</Kicker>
          <h2 className="mt-3 font-display text-4xl">Everything for GATE, built in.</h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            When the room goes quiet and it is time to solve, the tools are already there.
          </p>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {TOOLS.map((t) => (
              <li key={t.title}>
                <Link href={t.href} className="block h-full">
                  <Card className="h-full transition-colors hover:border-[var(--accent)]">
                    <h3 className="text-lg font-semibold">{t.title}</h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">{t.body}</p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mock paper branches */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-4xl">Mock papers for every GATE branch</h2>
            <p className="mt-3 max-w-2xl text-[var(--muted)]">
              Practice simulations based on historical patterns, not predictions of the real paper.
            </p>
          </div>
          <Link href="/predicted-papers" className="hidden shrink-0 text-sm text-[var(--accent)] hover:underline sm:block">
            All branches →
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {BRANCHES.map((b) => (
            <li key={b.code}>
              <Link
                href={`/predicted-papers/${b.code}`}
                aria-label={`GATE ${b.code.toUpperCase()} mock papers`}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-3 text-sm transition-colors hover:border-[var(--accent)]"
              >
                <span aria-hidden>{b.icon}</span>
                <span className="font-medium uppercase">{b.code}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="border-t border-[var(--border)] bg-[var(--background-alt)]">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <Kicker>FAQ</Kicker>
          <h2 className="mt-3 font-display text-4xl">Questions, answered.</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--background)] p-5">
                <summary className="cursor-pointer text-lg font-semibold">{f.q}</summary>
                <p className="mt-3 text-sm text-[var(--muted)]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--background-alt)] p-10 text-center">
          <h2 className="font-display text-4xl">Bring your friends.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--muted)]">
            GATE is a long road. It is easier when the people next to you are putting in the hours
            too. Start a room, share the key, and study together for free.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/rooms" size="lg">Create a study room</ButtonLink>
            <ButtonLink href="/library" variant="secondary" size="lg">Enter the virtual library</ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
