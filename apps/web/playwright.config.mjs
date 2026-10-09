import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || new URL(databaseUrl).pathname !== "/signaldesk_test") {
  throw new Error("Browser tests require the signaldesk_test database");
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("Browser tests require BETTER_AUTH_SECRET");
}

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  retries: 0,
  reporter: "list",
  outputDir: "../../tmp/playwright-results",
  use: {
    baseURL: "http://localhost:3100",
    browserName: "chromium",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      name: "NestJS API",
      command: "node apps/api/dist/main.js",
      cwd: repositoryRoot,
      url: "http://localhost:3101/",
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        BETTER_AUTH_URL: "http://localhost:3100",
        PORT: "3101",
      },
    },
    {
      name: "Next.js web",
      command: "npm run start --workspace=apps/web -- --port 3100",
      cwd: repositoryRoot,
      url: "http://localhost:3100/sign-in",
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        API_BASE_URL: "http://localhost:3101",
      },
    },
  ],
});
