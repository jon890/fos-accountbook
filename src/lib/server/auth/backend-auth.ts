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
async function savedTokensToCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  cookieStore.set("backend_access_token", accessToken, {
    httpOnly: true,
    secure: serverEnv.NODE_ENV === "production",
    maxAge: 24 * 60 * 60,
    path: "/api/auth/callback",
  });
  cookieStore.set("backend_refresh_token", refreshToken, {
    httpOnly: true,
    secure: serverEnv.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60,
    path: "/api/auth/callback",
  });
}
