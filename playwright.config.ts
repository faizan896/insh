import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    browserName: "chromium",
    viewport: { width: 1440, height: 900 },
    // The scene must follow Pakistan even when a visitor is elsewhere.
    timezoneId: "America/Los_Angeles",
    trace: "retain-on-failure",
    launchOptions: {
      // CI machines may have no physical GPU; still exercise the real renderer.
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
        : {}),
    },
  },
  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
