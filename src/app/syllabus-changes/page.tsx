import type { Metadata } from "next";
import { Kicker } from "@/components/ui";
import { Checklist } from "./Checklist";
import { SYLLABUS_SOURCE_URL, SYLLABUS_VERIFIED_ON } from "@/content/syllabus-changes";

export const metadata: Metadata = {
  title: "GATE 2027 Syllabus Changes: Sourced Checklist",
  description:
    "A checklist of GATE 2027 syllabus and paper changes, each traced to the official brochure.",
};

export default function SyllabusChangesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Kicker>GATE 2027</Kicker>
      <h1 className="mt-3 font-display text-5xl">Syllabus &amp; paper changes</h1>
      <p className="mt-4 text-[var(--muted)]">
        Only changes we could trace to an official source are listed. Tick each one off as you update
        your plan; your ticks stay on this device.
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Last verified on {SYLLABUS_VERIFIED_ON} against the{" "}
        <a
          href={SYLLABUS_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] hover:underline"
        >
          official GATE 2027 brochure
        </a>{" "}
        (opens in a new tab).
      </p>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Change checklist</h2>
        <div className="mt-4">
          <Checklist />
        </div>
      </section>
    </div>
  );
}
