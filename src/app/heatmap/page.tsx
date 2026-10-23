import type { Metadata } from "next";
import { Kicker, Card, ButtonLink } from "@/components/ui";
import { withUser } from "@/components/RequireAuth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Topic Heatmap" };

export default async function HeatmapPage() {
  return withUser(async (user) => {
    if (!user.isPremium) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
          <Kicker>Premium</Kicker>
          <h1 className="mt-3 font-display text-4xl">Topic heatmap</h1>
          <Card className="mt-8 text-center">
            <p className="text-4xl" aria-hidden>
              🔒
            </p>
            <h2 className="mt-3 text-lg font-semibold">This is a Premium feature</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
              The topic heatmap shows your accuracy across every subject and topic so you know exactly
              what to revise. Upgrade to Premium to unlock it.
            </p>
            <div className="mt-6">
              <ButtonLink href="/dashboard">Back to dashboard</ButtonLink>
            </div>
          </Card>
        </div>
      );
    }

    // Premium: render the real heatmap from the user's attempts.
    const attempts = await db.questionAttempt.findMany({
      where: { userId: user.id },
      include: { question: { select: { subjectName: true, topicName: true } } },
    });
    const cells = new Map<string, { attempted: number; correct: number }>();
    for (const a of attempts) {
      const key = `${a.question.subjectName}::${a.question.topicName ?? "General"}`;
      const c = cells.get(key) ?? { attempted: 0, correct: 0 };
      c.attempted++;
      if (a.isCorrect) c.correct++;
      cells.set(key, c);
    }
    const rows = [...cells.entries()].map(([k, v]) => {
      const [subject, topic] = k.split("::");
      return { subject, topic, ...v, accuracy: Math.round((v.correct / v.attempted) * 100) };
    });

    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Kicker>Premium</Kicker>
        <h1 className="mt-3 font-display text-4xl">Topic heatmap</h1>
        {rows.length === 0 ? (
          <Card className="mt-8">
            <p className="text-sm text-[var(--muted)]">
              Answer some PYQs to build your heatmap.
            </p>
          </Card>
        ) : (
          <ul className="mt-8 space-y-2">
            {rows.map((r) => (
              <li key={`${r.subject}-${r.topic}`}>
                <Card className="flex items-center justify-between py-3">
                  <span className="text-sm">
                    {r.subject} · {r.topic}
                  </span>
                  <span
                    className="rounded px-2 py-0.5 text-xs font-medium"
                    style={{
                      background: `color-mix(in oklab, var(--success) ${r.accuracy}%, var(--error))`,
                      color: "#fff",
                    }}
                  >
                    {r.accuracy}% ({r.correct}/{r.attempted})
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  });
}
