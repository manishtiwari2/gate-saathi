import type { Metadata } from "next";
import { Kicker } from "@/components/ui";
import { DoubtsClient } from "./DoubtsClient";

export const metadata: Metadata = {
  title: "GATE AI Doubt Solver: 5 Free Doubts a Day",
  description:
    "Ask any GATE doubt and get a step-by-step explanation. 5 questions a day free, unlimited on Premium.",
};

export default function DoubtsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <Kicker>AI Tutor</Kicker>
        <h1 className="mt-3 font-display text-5xl">AI Doubt Engine</h1>
        <p className="mt-4 text-lg text-[var(--muted)]">
          Step-by-step explanations for GATE doubts, grounded in concepts. 5 questions a day free,
          unlimited on Premium.
        </p>
      </div>
      <div className="mt-12">
        <DoubtsClient />
      </div>
    </div>
  );
}
