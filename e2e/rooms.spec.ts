import { test, expect } from "@playwright/test";
import { devLogin, gotoReady } from "./helpers";

test("sign in returns to rooms; create a room, chat, see yourself online", async ({ page }) => {
  await gotoReady(page, "/rooms");
  await page.locator("main").getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Frooms/);
  await devLogin(page, "Room Tester");
  await expect(page).toHaveURL(/\/rooms$/);

  // Create a room through the page's own form; it opens the new room.
  await page.getByRole("button", { name: "Create Room" }).first().click();
  await page.locator("#rname").fill("E2E study room");
  await page.locator("form").getByRole("button", { name: "Create Room" }).click();
  await expect(page.getByRole("heading", { name: "E2E study room" })).toBeVisible();

  // The focus timer keeps running across tab switches.
  await page.getByRole("button", { name: "Start Session" }).click();
  await page.getByRole("tab", { name: "chat" }).click();
  await page.waitForTimeout(2_500);
  await page.getByRole("tab", { name: "focus" }).click();
  await expect(page.locator(".tabular-nums")).not.toHaveText("00:00");

  // Chat round trip.
  await page.getByRole("tab", { name: "chat" }).click();
  await page.getByLabel("Message").fill("hello from e2e");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("hello from e2e")).toBeVisible();

  // Presence: I'm online while the room page is open.
  await page.getByRole("tab", { name: "members" }).click();
  await expect(page.getByText(/Room Tester \(you\)/)).toBeVisible();
  await expect(page.getByText("active", { exact: true })).toBeVisible();
});
