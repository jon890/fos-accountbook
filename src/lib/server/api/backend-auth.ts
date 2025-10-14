/**
 * 백엔드 인증 API
 *
 * 백엔드 서버의 인증 관련 API를 호출합니다.
 */

import { serverApiClient } from "./client";
import { BackendAuthResponse } from "./types";

/**
 * 백엔드 API에서 JWT 토큰 획득
 *
 * OAuth 로그인 시 백엔드에 사용자를 등록하고 JWT 토큰을 발급받습니다.
 */
export async function getBackendJWT(user: {
  provider: string;
  providerId: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}): Promise<BackendAuthResponse | null> {
  try {
    // skipAuth: true - 인증 전이므로 Authorization 헤더 불필요
    const response = await serverApiClient<{ data: BackendAuthResponse }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({
          provider: user.provider,
          providerId: user.providerId,
          email: user.email,
          name: user.name,
          image: user.image,
        }),
        skipAuth: true, // 공개 API (인증 불필요)
      }
    );

    // ApiSuccessResponse<AuthResponse> 형식에서 데이터 추출
    const result = response.data || response;
    return result as BackendAuthResponse;
  } catch {
    return null;
  }
}

/**
 * JWT 토큰 갱신
 *
 * Refresh Token을 사용하여 새로운 Access Token을 발급받습니다.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<BackendAuthResponse | null> {
  try {
    // skipAuth: true - 토큰 갱신은 인증 전이므로 Authorization 헤더 불필요
    const response = await serverApiClient<{ data: BackendAuthResponse }>(
      "/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
        skipAuth: true, // 공개 API (인증 불필요)
      }
    );

    return response.data || (response as unknown as BackendAuthResponse);
  } catch {
    return null;
  }
}
