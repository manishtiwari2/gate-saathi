import { test, expect } from "@playwright/test";
import { devLogin, gotoReady } from "./helpers";

test("mobile menu offers sign out once signed in", async ({ page }) => {
  await gotoReady(page, "/login");
  await devLogin(page, "Mobile Tester");
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByRole("button", { name: "Toggle menu" }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mobile Tester" })).toBeVisible();
});
