import type { Metadata } from "next";
import { Kicker, Card, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "The Virtual Library",
  description:
    "Step into a quiet university library populated by fellow students. Move around, find your spot, study together, and communicate when you want to.",
};

const zones = [
  {
    title: "Main Reading Area",
    description:
      "Large open study space with desks, bookshelves, and natural light. Perfect for focused individual study.",
  },
  {
    title: "Quiet Zone",
    description: "A completely silent study environment. Microphones off. Maximum focus.",
  },
  {
    title: "Group Study",
    description: "Collaborative tables for small groups. Whisper with nearby students.",
  },
  {
    title: "Discussion Room",
    description:
      "Dedicated space for active discussion, debate, and collaborative problem-solving.",
  },
];

const steps = [
  {
    title: "Enter the library",
    description: "Join the shared space and see who else is studying right now.",
  },
  {
    title: "Find your spot",
    description: "Pick a zone that matches how you want to work, then settle in.",
  },
  {
    title: "Study your way",
    description: "Focus solo or connect with nearby students — the choice is always yours.",
  },
];

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <section className="max-w-2xl">
        <Kicker>Virtual library</Kicker>
        <h1 className="mt-3 font-display text-5xl">The Virtual Library</h1>
        <p className="mt-4 text-lg text-[var(--muted)]">
          Step into a quiet university library populated by fellow students. Move around, find your
          spot, study together, and communicate when you want to.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <ButtonLink href="/library/world" size="lg">
            Enter the virtual library
          </ButtonLink>
          <ButtonLink href="/library/content" variant="secondary" size="lg">
            Browse library content
          </ButtonLink>
        </div>
      </section>

      <section className="mt-20">
        <h2 className="font-display text-3xl">Find your space.</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {zones.map((zone) => (
            <Card key={zone.title}>
              <h3 className="font-display text-xl">{zone.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{zone.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <h2 className="font-display text-3xl">Study with others, without the pressure.</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Card key={step.title}>
              <span className="kicker">Step {i + 1}</span>
              <h3 className="mt-2 font-display text-lg">{step.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{step.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-20 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--background-alt)] p-8 text-center sm:p-12">
        <h2 className="font-display text-3xl">Ready to study together?</h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <ButtonLink href="/library/world" size="lg">
            Enter the virtual library
          </ButtonLink>
          <ButtonLink href="/library/content" variant="secondary" size="lg">
            Browse library content
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
