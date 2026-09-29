/**
 * jwt callback refresh 실패 가드 단위 테스트 (ADR-F09 jest.mock 방식)
 * @jest-environment node
 */

jest.mock("@/lib/env/server.env", () => ({
  serverEnv: {
    BACKEND_API_URL: "http://localhost:8080",
  },
}));

jest.mock("@/lib/server/auth/backend-auth");
jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({ set: jest.fn() }),
}));

import { refreshBackendToken } from "@/lib/server/auth/backend-auth";
import { refreshTokenIfNeeded } from "@/lib/server/auth/refresh-token";
import type { JWT } from "next-auth/jwt";

const mockRefreshBackendToken = refreshBackendToken as jest.MockedFunction<
  typeof refreshBackendToken
>;

function makeToken(overrides: Partial<JWT> = {}): JWT {
  const futureExpiry = new Date(Date.now() + 3600000).toISOString();
  return {
    userUuid: "test-uuid",
    backendAccessToken: "access-token",
    backendRefreshToken: "refresh-token",
    backendTokenExpiredAt: futureExpiry,
    backendTokenIssuedAt: new Date().toISOString(),
    profile: null,
    ...overrides,
  };
}

function makeExpiredToken(overrides: Partial<JWT> = {}): JWT {
  const pastExpiry = new Date(Date.now() - 1000).toISOString();
  return makeToken({ backendTokenExpiredAt: pastExpiry, ...overrides });
}

describe("refreshTokenIfNeeded — refresh 실패 가드", () => {
  beforeEach(() => {
    mockRefreshBackendToken.mockClear();
  });

  it("refresh 실패 시 token.error를 RefreshAccessTokenError로 설정한다", async () => {
    mockRefreshBackendToken.mockResolvedValue({
      success: false,
      error: "Unauthorized",
    });

    const token = makeExpiredToken();
    const result = await refreshTokenIfNeeded(token);

    expect(result.error).toBe("RefreshAccessTokenError");
    expect(mockRefreshBackendToken).toHaveBeenCalledTimes(1);
  });

  it("token.error가 이미 설정된 경우 refreshBackendToken을 호출하지 않는다 (재시도 스킵)", async () => {
    const token = makeExpiredToken({ error: "RefreshAccessTokenError" });
    const result = await refreshTokenIfNeeded(token);

    expect(mockRefreshBackendToken).not.toHaveBeenCalled();
    expect(result.error).toBe("RefreshAccessTokenError");
  });

  it("refresh 성공 시 토큰을 갱신하고 token.error가 undefined로 초기화된다", async () => {
    mockRefreshBackendToken.mockResolvedValue({
      success: true,
      data: {
        user: { uuid: "test-uuid", email: "test@test.com", name: "테스트" },
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        expiredAt: new Date(Date.now() + 3600000).toISOString(),
        issuedAt: new Date().toISOString(),
      },
    });

    const token = makeExpiredToken({ error: undefined });
    const result = await refreshTokenIfNeeded(token);

    expect(result.backendAccessToken).toBe("new-access-token");
    expect(result.error).toBeUndefined();
    expect(mockRefreshBackendToken).toHaveBeenCalledTimes(1);
  });

  it("만료 임박하지 않은 토큰은 refresh를 시도하지 않는다", async () => {
    const token = makeToken();
    await refreshTokenIfNeeded(token);

    expect(mockRefreshBackendToken).not.toHaveBeenCalled();
  });
});
