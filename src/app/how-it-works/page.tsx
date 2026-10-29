import type { Metadata } from "next";
import { Kicker, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "How it works",
  description: "How GATE Saathi fits into your GATE preparation: practise PYQs, clear doubts, study with friends, track your time.",
};

const LOOP = [
  { title: "Pick a subject", body: "Choose your GATE branch and a subject, and filter previous-year questions by year." },
  { title: "Practise", body: "Work through questions in browse mode, or one at a time in quiz mode." },
  { title: "Check your answer", body: "Questions with a verified official answer key are graded instantly. Each question shows whether its key is verified yet." },
  { title: "Clear the doubt", body: "Stuck? Send the question to the AI tutor for a step-by-step explanation (5 a day free)." },
  { title: "Study together", body: "Open a study room with friends, run the focus timer side by side, and talk it through in the room chat." },
  { title: "Track it", body: "Your dashboard shows your streak, daily goal and the last 30 days, counted in your own time zone." },
];

const PLAN = [
  { title: "Know where you stand", body: "The rank predictor estimates your All-India rank from expected marks and checks it against your category's qualifying cutoff." },
  { title: "Know the bar", body: "Past cutoffs for every branch, by category, so you can set a realistic target." },
  { title: "Know what changed", body: "A checklist of the GATE 2027 paper and syllabus changes, each traced to the official brochure." },
  { title: "Know the date", body: "A countdown to the first GATE 2027 exam day on your dashboard." },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <Kicker>How it works</Kicker>
      <h1 className="mt-3 font-display text-5xl">Practise, clear doubts, keep going.</h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
        GATE Saathi doesn&apos;t teach the syllabus. It gives you the practice, the doubt-clearing and
        the study company around it.
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
        <h2 className="font-display text-3xl">Plan around the real exam.</h2>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Tools for deciding what to aim for and how much time you have left.
        </p>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {PLAN.map((a) => (
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
