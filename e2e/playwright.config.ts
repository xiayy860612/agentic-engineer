import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    // Use 127.0.0.1 (not localhost) so the browser treats admin-web and Auth (127.0.0.1:8000) as same-site for cookies.
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "Mobile",
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: [
    {
      command: "bash ./scripts/start-auth-for-playwright.sh",
      cwd: __dirname,
      url: "http://127.0.0.1:8000/openapi.json",
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
    },
    {
      command:
        "env NEXT_PUBLIC_AUTH_API_BASE_URL=http://127.0.0.1:8000 pnpm --dir ../admin-web exec next dev -p 3000 -H 127.0.0.1",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
