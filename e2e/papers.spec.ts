import { test, expect } from "@playwright/test";
import { gotoReady } from "./helpers";

test("official papers: practise with the official key", async ({ page }) => {
  await gotoReady(page, "/papers");
  await expect(page.getByRole("heading", { name: /GATE CS papers/ })).toBeVisible();
  await page.getByRole("link", { name: "Practise" }).first().click();
  await page.waitForLoadState("networkidle");

  // Answer the first General Aptitude question and check it.
  const first = page.locator("ol li").first();
  await first.getByRole("button", { name: "A", exact: true }).click();
  await first.getByRole("button", { name: "Check" }).click();
  await expect(first.getByText(/Official key|Marks to all/)).toBeVisible();
});

test("official papers: a paper without a key says so honestly", async ({ page }) => {
  await gotoReady(page, "/papers/cs-2025-1");
  await expect(page.getByText(/answer key for this paper hasn.t been added yet/)).toBeVisible();
  const res = await page.goto("/papers/cs-2025-1/mock");
  expect(res?.status()).toBe(404);
});

test("official papers: timed mock keeps progress across a reload and scores on submit", async ({ page }) => {
  await gotoReady(page, "/papers/cs-2018/mock");
  await page.evaluate(() => localStorage.removeItem("mock:cs-2018"));
  await page.reload();
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: /Start the 180-minute test/ }).click();
  await expect(page.getByText(/⏱ 2:5\d:\d\d|⏱ 3:00:00/)).toBeVisible();
  await page.getByRole("group").first().getByRole("button", { name: "A", exact: true }).click();
  await expect(page.getByText("1/65 answered")).toBeVisible();

  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("1/65 answered")).toBeVisible();

  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Submit test" }).click();
  await expect(page.getByText(/Your score \(GATE marking\)/i)).toBeVisible();
  await expect(page.getByText(/\d+ correct · \d+ wrong · 64 not answered/)).toBeVisible();
});
