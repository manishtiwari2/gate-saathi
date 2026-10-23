import Link from "next/link";
import { getCurrentUser, type CurrentUser } from "@/lib/session";
import { Card, ButtonLink } from "@/components/ui";

/**
 * Server-side auth gate for page content. Renders a sign-in prompt instead of
 * redirecting, so the page URL stays shareable.
 */
export async function withUser(
  render: (user: CurrentUser) => React.ReactNode,
): Promise<React.ReactNode> {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <Card className="text-center">
          <h1 className="font-display text-2xl">Sign in to continue</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            This page needs an account. It&apos;s free to start.
          </p>
          <div className="mt-6">
            <ButtonLink href="/login">Sign in</ButtonLink>
          </div>
          <p className="mt-4 text-xs text-[var(--muted)]">
            Or <Link href="/pyqs" className="text-[var(--accent)] hover:underline">browse free PYQs</Link>.
          </p>
        </Card>
      </div>
    );
  }
  return render(user);
}
