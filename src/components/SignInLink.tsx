"use client";

import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui";
import { loginHref } from "@/lib/utils";

/** "Sign in" button that returns the user to the current page afterwards. */
export function SignInLink({ children = "Sign in" }: { children?: React.ReactNode }) {
  return <ButtonLink href={loginHref(usePathname())}>{children}</ButtonLink>;
}
