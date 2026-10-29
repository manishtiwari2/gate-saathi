import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a running app with a seeded database
 * (`docker compose up -d && npx prisma migrate deploy && npm run db:seed`).
 * Uses the dev server so the local dev login is available for sign-in flows;
 * it is disabled in production builds by design.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile.spec.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { ENABLE_DEV_LOGIN: "true" },
  },
});
