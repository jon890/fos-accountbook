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
): Promise<AuthResponse> {
  const socialLoginResponse = await serverApiPost<AuthResponse>(
    "/auth/refresh",
    data
  );

  await savedTokensToCookies(
    socialLoginResponse.accessToken,
    socialLoginResponse.refreshToken
  );

  return socialLoginResponse;
}

async function savedTokensToCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  cookieStore.set("backend_access_token", accessToken, {
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60,
  });
  cookieStore.set("backend_refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    maxAge: 30 * 24 * 60 * 60,
  });
}
