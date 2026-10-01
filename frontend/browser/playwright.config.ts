import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";
import {
  AUTH_SECRET,
  BACKEND_BASE_URL,
  WEB_BASE_URL,
} from "./settings";

const serverEnv = {
  AUTH_URL: WEB_BASE_URL,
  AUTH_SECRET,
  AUTH_GOOGLE_ID: "browser-google-id",
  AUTH_GOOGLE_SECRET: "browser-google-secret",
  AUTH_NAVER_ID: "browser-naver-id",
  AUTH_NAVER_SECRET: "browser-naver-secret",
  AUTH_TRUST_HOST: "true",
  BACKEND_API_URL: `${BACKEND_BASE_URL}/api/v1`,
};

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  workers: 1,
  fullyParallel: false,
  outputDir: resolve(__dirname, "../test-results"),
  use: {
    baseURL: WEB_BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
  ],
  webServer: [
    {
      command: "node fake-backend.mjs",
      url: `${BACKEND_BASE_URL}/__test/unhandled`,
      reuseExistingServer: false,
    },
    {
      command: "node web-server.mjs",
      url: WEB_BASE_URL,
      reuseExistingServer: false,
      timeout: 180_000,
      env: serverEnv,
    },
  ],
});
