import { test, expect } from "@playwright/test";
import { gotoReady } from "./helpers";

test("home page shows the GATE 2027 countdown", async ({ page }) => {
  await gotoReady(page, "/");
  await expect(page.getByText(/days to GATE 2027|GATE 2027 is underway/)).toBeVisible();
});

test("PYQs: pick a subject, filter by year, answer a question", async ({ page }) => {
  await gotoReady(page, "/pyqs/cs");
  await page.getByRole("button", { name: /General Aptitude/ }).click();
  await expect(page.getByText(/have a verified answer key/)).toBeVisible();

  await page.getByLabel("Year").selectOption("2023");
  // Year badges on the question cards (not the <option>s in the filter).
  const badges = page.locator("main").getByText(/^GATE 20\d\d$/).and(page.locator(":not(option)"));
  await expect(badges.first()).toHaveText("GATE 2023");
  for (const t of await badges.allTextContents()) expect(t).toBe("GATE 2023");

  // Answer the first question. With no verified keys yet, the app must say so
  // rather than guess.
  await page.locator("main ul button[aria-pressed]").first().click();
  await expect(page.getByText(/isn.t verified yet|Correct!|Not quite/)).toBeVisible();
});

test("predictor: qualifying verdict follows the category cutoff", async ({ page }) => {
  await gotoReady(page, "/predictor");
  await page.getByLabel(/expected marks/i).fill("26");
  await page.getByLabel("Branch").selectOption("cs");

  await page.getByLabel("Category").selectOption("general");
  await page.getByRole("button", { name: /Estimate my rank/ }).click();
  await expect(page.getByText(/Below the General qualifying cutoff/)).toBeVisible();

  await page.getByLabel("Category").selectOption("sc-st-pwd");
  await page.getByRole("button", { name: /Estimate my rank/ }).click();
  await expect(page.getByText(/Likely above the SC \/ ST \/ PwD qualifying cutoff/)).toBeVisible();
});

test("mock papers link to real PYQs instead of a sign-in loop", async ({ page }) => {
  await gotoReady(page, "/predicted-papers/cs");
  const link = page.getByRole("link", { name: /Practice CS previous-year questions/ }).first();
  await expect(link).toHaveAttribute("href", "/pyqs/cs");
});
