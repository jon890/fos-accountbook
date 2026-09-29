import type { JWT } from "next-auth/jwt";
import { refreshBackendToken } from "./backend-auth";

/**
 * refresh 실패 가드를 포함한 토큰 갱신 로직
 *
 * - token.error === "RefreshAccessTokenError" 이면 재시도하지 않고 바로 반환 (ADR-F26)
 * - 만료 5분 전부터 갱신 시도; 실패 시 token.error 설정
 */
export async function refreshTokenIfNeeded(token: JWT): Promise<JWT> {
  // 이미 refresh 실패한 토큰이면 재시도하지 않음 (401 경로가 처리)
  if (token.error === "RefreshAccessTokenError") {
    return token;
  }

  if (
    token.backendTokenExpiredAt &&
    token.backendRefreshToken &&
    token.backendAccessToken
  ) {
    const expiredAt = new Date(token.backendTokenExpiredAt);
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5분 전에 갱신

    if (now.getTime() >= expiredAt.getTime() - bufferTime) {
      const refreshedResponse = await refreshBackendToken({
        refreshToken: token.backendRefreshToken,
      });

      if (refreshedResponse.success) {
        token.backendAccessToken = refreshedResponse.data.accessToken;
        token.backendRefreshToken = refreshedResponse.data.refreshToken;
        token.backendTokenExpiredAt = refreshedResponse.data.expiredAt;
        token.backendTokenIssuedAt = refreshedResponse.data.issuedAt;
        delete token.error;
      } else {
        // 갱신 실패 — token.error 플래그만 설정. 다음 API 호출 401 시 ADR-F26 흐름(A002 → redirect)이 사용자 인지 처리.
        token.error = "RefreshAccessTokenError";
      }
    }
  }

  return token;
}
