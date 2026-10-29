import type { Page } from "@playwright/test";

/**
 * Navigate and wait until the page has finished loading its scripts, so
 * clicks reach hydrated React handlers (the dev server compiles on demand).
 */
export async function gotoReady(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}

/** Sign in through the local dev login with a fresh test account. */
export async function devLogin(page: Page, name = "E2E Tester") {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@gate-saathi.test`;
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Your name").fill(name);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  await page.waitForLoadState("networkidle");
  return email;
}
