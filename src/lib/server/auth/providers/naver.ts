/**
 * 네이버 OAuth 프로바이더 설정
 * NextAuth v5에서는 네이버 프로바이더가 기본 제공되지 않으므로 커스텀 구현
 */

import type { OAuthConfig, OAuthUserConfig } from "@auth/core/providers/oauth";
import type { NaverProfile } from "@/types/auth";

/**
 * 네이버 OAuth 프로바이더 생성
 *
 * @param options - 네이버 OAuth 클라이언트 설정
 * @returns NextAuth OAuth 프로바이더 설정
 */
export function NaverProvider(
  options: OAuthUserConfig<NaverProfile>
): OAuthConfig<NaverProfile> {
  return {
    id: "naver",
    name: "Naver",
    type: "oauth",
    authorization: {
      url: "https://nid.naver.com/oauth2.0/authorize",
      params: {
        response_type: "code",
        scope: "name email profile_image",
      },
    },
    token: "https://nid.naver.com/oauth2.0/token",
    userinfo: "https://openapi.naver.com/v1/nid/me",
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    profile(profile: NaverProfile) {
      return {
        id: profile.response.id,
        name: profile.response.name,
        email: profile.response.email,
        image: profile.response.profile_image ?? undefined,
      } as const;
    },
  } as OAuthConfig<NaverProfile>;
}
