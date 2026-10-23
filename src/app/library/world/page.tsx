import type { Metadata } from "next";
import Link from "next/link";
import { withUser } from "@/components/RequireAuth";
import { WorldCanvas } from "./WorldCanvas";

export const metadata: Metadata = {
  title: "Virtual Library: Study Online With Other GATE Aspirants",
};

export default async function LibraryWorldPage() {
  return withUser((user) => (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <nav className="text-sm text-[var(--muted)]">
        <Link href="/library" className="hover:text-[var(--foreground)]">
          Library
        </Link>{" "}
        / <span className="text-[var(--foreground)]">Virtual Library</span>
      </nav>
      <h1 className="mt-3 font-display text-3xl">Virtual Library</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Walk around, find a zone and study alongside other aspirants.
      </p>
      <div className="mt-6">
        <WorldCanvas selfName={user.displayName} />
      </div>
    </div>
  ));
}
