import { expect, test as base } from "@playwright/test";
import { encode } from "next-auth/jwt";
import {
  AUTH_SECRET,
  BACKEND_BASE_URL,
  FAMILY_UUID,
  USER_UUID,
  WEB_BASE_URL,
} from "./settings";

const sessionCookieName = "authjs.session-token";

export const test = base.extend<{ fakeBackend: void }>({
  fakeBackend: [
    async ({}, complete) => {
      await resetFakeBackend();

      await complete(undefined);

      const unhandled = await getUnhandledRequests();
      expect(
        unhandled,
        `Unhandled fake backend requests: ${unhandled.join(", ")}`,
      ).toEqual([]);
    },
    { auto: true },
  ],
  page: async ({ page, context }, grantPage) => {
    await context.addCookies([
      {
        name: sessionCookieName,
        value: await createSessionToken(),
        url: WEB_BASE_URL,
        httpOnly: true,
        sameSite: "Lax",
      },
      {
        name: "backend_access_token",
        value: "browser-test-backend-access-token",
        url: WEB_BASE_URL,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    await grantPage(page);
  },
});

export { expect };

async function createSessionToken(): Promise<string> {
  return encode({
    salt: sessionCookieName,
    secret: AUTH_SECRET,
    token: {
      sub: USER_UUID,
      userUuid: USER_UUID,
      profile: {
        defaultFamilyUuid: FAMILY_UUID,
        timezone: "Asia/Seoul",
        language: "ko",
        currency: "KRW",
      },
      backendAccessToken: "browser-test-backend-access-token",
      backendRefreshToken: "browser-test-backend-refresh-token",
      backendTokenExpiredAt: "2099-01-01T00:00:00.000Z",
      backendTokenIssuedAt: "2026-01-01T00:00:00.000Z",
    },
  });
}

async function resetFakeBackend(): Promise<void> {
  const response = await fetch(`${BACKEND_BASE_URL}/__test/reset`, { method: "POST" });
  if (!response.ok) throw new Error(`Fake backend reset failed: ${response.status}`);
}

async function getUnhandledRequests(): Promise<string[]> {
  const response = await fetch(`${BACKEND_BASE_URL}/__test/unhandled`);
  if (!response.ok) throw new Error(`Fake backend unhandled lookup failed: ${response.status}`);
  return response.json() as Promise<string[]>;
}
