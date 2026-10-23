import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isGoogleEnabled, isDevLoginEnabled } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Log In or Sign Up Free",
  description: "Sign in to GATE Saathi to track attempts, join study rooms and more.",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-16 sm:px-6">
      <LoginForm googleEnabled={isGoogleEnabled} devEnabled={isDevLoginEnabled} />
    </div>
  );
}
