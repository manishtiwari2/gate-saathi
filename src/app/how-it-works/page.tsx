import type { Metadata } from "next";
import { Kicker, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "How it works",
  description: "The learning loop behind GATE Saathi: learn, practice, get feedback, improve.",
};

const LOOP = [
  { title: "Learn", body: "Start with a structured lesson that makes the next step clear without overwhelming you." },
  { title: "Do", body: "Apply what you learned through real practice. Active engagement is where skills develop." },
  { title: "Get feedback", body: "The AI analyzes your performance, identifies mistakes, and shows exactly what to change." },
  { title: "Adapt", body: "If you're struggling, you get a simpler explanation, a different example, or targeted practice." },
  { title: "Repeat", body: "Important topics return through spaced practice instead of being forgotten after one lesson." },
  { title: "Improve", body: "Track progress over time and gradually take on harder challenges. Growth is visible and measurable." },
];

const ADAPT = [
  { title: "You're struggling?", body: "The AI detects where you're stuck and adjusts — slower explanations, different examples, or targeted practice on that specific area." },
  { title: "Making the same mistake?", body: "The AI notices patterns in your practice and focuses on the weakness that's holding you back." },
  { title: "Already mastering it?", body: "Move forward instead of repeating what you already know. The AI recognizes your progress and adjusts." },
  { title: "Losing progress?", body: "Important topics return at the right time. Spaced review ensures what you learn stays with you." },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <Kicker>How it works</Kicker>
      <h1 className="mt-3 font-display text-5xl">The loop that builds skills.</h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
        Every learning experience follows the same loop — designed around how people actually learn,
        practice, and remember.
      </p>

      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {LOOP.map((s, i) => (
          <li key={s.title}>
            <Card className="h-full">
              <span aria-hidden className="font-display text-2xl text-[var(--accent)]">
                0{i + 1}
              </span>
              <h2 className="mt-2 text-lg font-semibold">{s.title}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{s.body}</p>
            </Card>
          </li>
        ))}
      </ul>

      <section className="mt-16">
        <h2 className="font-display text-3xl">AI that adapts to your practice.</h2>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          The AI isn&apos;t just a chatbot beside a course. It&apos;s an active part of the learning
          loop — responding to how you practice, where you struggle, and when you&apos;re ready for
          more.
        </p>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {ADAPT.map((a) => (
            <li key={a.title}>
              <Card className="h-full">
                <h3 className="font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{a.body}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
