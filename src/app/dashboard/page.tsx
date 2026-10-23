import type { Metadata } from "next";
import { withUser } from "@/components/RequireAuth";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  return withUser((user) => (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <DashboardClient name={user.displayName} />
    </div>
  ));
}
