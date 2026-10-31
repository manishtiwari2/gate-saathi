import type { Metadata } from "next";
import { Kicker, Card, Badge, ButtonLink } from "@/components/ui";
import { BuyButton } from "@/components/billing/BuyButton";
import { getCurrentUser } from "@/lib/session";
import { loginHref } from "@/lib/utils";
import { isPaymentsEnabled, PREMIUM_PRICE_PAISE, formatRupees } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Pricing",
  description: "GATE Saathi is free to use. A one-time Premium pass unlocks more AI doubts, the accuracy heatmap and premium library notes.",
};

// Depends on who is signed in, so it can't be prerendered.
export const dynamic = "force-dynamic";

const FREE = [
  "Previous-year questions for every branch",
  "Official GATE CS papers with practice and timed mocks",
  "Rank predictor and cutoffs",
  "Study rooms, focus timer and dashboard",
  "5 AI doubts a day",
];

const PREMIUM = [
  "Everything in Free",
  "100 AI doubts a day instead of 5",
  "Topic accuracy heatmap",
  "Premium library notes",
];

function Features({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-3 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden className="text-[var(--accent)]">
            ✓
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function PricingPage() {
  const user = await getCurrentUser();
  const enabled = isPaymentsEnabled();

  let action: React.ReactNode;
  if (user?.isPremium) {
    action = <Badge tone="success">You already have Premium</Badge>;
  } else if (!enabled) {
    action = <p className="text-sm text-[var(--muted)]">Payments are coming soon.</p>;
  } else if (!user) {
    action = (
      <ButtonLink href={loginHref("/pricing")} className="w-full">
        Sign in to buy Premium
      </ButtonLink>
    );
  } else {
    action = <BuyButton
        label={`Buy Premium for ${formatRupees(PREMIUM_PRICE_PAISE)}`}
        name={user.displayName}
        email={user.email}
      />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <Kicker>Pricing</Kicker>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">Free to start. Pay once for more.</h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
        No subscription. Premium is a single one-time pass.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <h2 className="text-lg font-semibold">Free</h2>
          <p className="mt-2 font-display text-4xl">{formatRupees(0)}</p>
          <Features items={FREE} />
        </Card>

        <Card className="flex flex-col border-[var(--accent)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Premium</h2>
            <Badge tone="accent">One-time pass</Badge>
          </div>
          <p className="mt-2 font-display text-4xl">{formatRupees(PREMIUM_PRICE_PAISE)}</p>
          <Features items={PREMIUM} />
          <div className="mt-8 pt-2">{action}</div>
        </Card>
      </div>
    </div>
  );
}
