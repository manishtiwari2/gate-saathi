import type { Metadata } from "next";
import { Kicker } from "@/components/ui";
import { PredictorForm } from "./PredictorForm";

export const metadata: Metadata = {
  title: "GATE Rank Predictor: Estimate Your AIR From Marks",
  description:
    "Estimate your GATE All India Rank from expected marks, using historical qualifying statistics per branch.",
};

export default function PredictorPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <Kicker>Rank predictor</Kicker>
        <h1 className="mt-3 font-display text-5xl">
          Know your rank.
          <br />
          Before results.
        </h1>
        <p className="mt-4 text-lg text-[var(--muted)]">
          Enter your expected marks and branch to get an estimated All India Rank range, based on
          historical qualifying data.
        </p>
      </div>
      <div className="mt-12">
        <PredictorForm />
      </div>
    </div>
  );
}
