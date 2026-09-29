import { serverEnv } from "@/lib/env/server.env";
import { AuthResponse, RefreshTokenRequest } from "@/types";
import { cookies } from "next/headers";
import { serverApiPost } from "../api";

type SocialLoginRequest = {
  provider: string;
  providerId: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export async function requestSocialLogin(
  data: SocialLoginRequest
): Promise<AuthResponse> {
  const socialLoginResponse = await serverApiPost<AuthResponse>(
    "/auth/social-login",
    data
  );

  await savedTokensToCookies(
    socialLoginResponse.accessToken,
    socialLoginResponse.refreshToken
  );

  return socialLoginResponse;
}

export async function refreshBackendToken(
  data: RefreshTokenRequest
): Promise<
  { success: true; data: AuthResponse } | { success: false; error: string }
> {
  try {
    const refreshTokenResponse = await serverApiPost<AuthResponse>(
      "/auth/refresh",
      data
    );

    await savedTokensToCookies(
      refreshTokenResponse.accessToken,
      refreshTokenResponse.refreshToken
    );

    return { success: true, data: refreshTokenResponse };
  } catch (error) {
    console.error("[backend-auth.ts] refreshBackendToken error", error);
    return {
      success: false,
      error: (error as Error).message || "Unknown error",
    };
  }
}

/**
 * 백엔드 JWT 토큰을 HTTP-only 쿠키에 저장
 *
 * @param accessToken - 백엔드 Access Token
 * @param refreshToken - 백엔드 Refresh Token
 */
async function savedTokensToCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();

  // Access Token 쿠키 설정
  cookieStore.set("backend_access_token", accessToken, {
    httpOnly: true,
    secure: serverEnv.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24시간
    path: "/", // ✅ 전체 애플리케이션에서 접근 가능하도록 설정
  });

  // Refresh Token 쿠키 설정
  cookieStore.set("backend_refresh_token", refreshToken, {
    httpOnly: true,
    secure: serverEnv.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30일
    path: "/", // ✅ 전체 애플리케이션에서 접근 가능하도록 설정
  });
}
