import { UserProfile } from "@/types";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Naver from "next-auth/providers/naver";
import { refreshBackendToken, requestSocialLogin } from "./backend-auth";
import { fetchUserProfile } from "./profile-fetcher";

export const authConfig = {
  providers: [Google, Naver],
  callbacks: {
    /**
     * 사용자의 가입 허용 여부 제어
     * https://authjs.dev/guides/restricting-user-access
     */
    async signIn({ user, account, profile }) {
      return true;
    },

    /**
     * auth.js JWT 토큰이 생성된 후에 호출되는 콜백
     * 이 시점에서, backend를 호출하여 backend 호출용 jwt 토큰을 발급받아 와야한다.
     *
     * 프로필 정보도 JWT 토큰에 캐싱하여 session callback에서 매번 API 호출하지 않도록 함.
     * - 초기 로그인 시: 프로필 조회 후 토큰에 저장
     * - trigger === "update" 시: 프로필 재조회 (클라이언트에서 update() 호출 시)
     */
    async jwt({ token, user, account, trigger }) {
      // 초기 로그인 시
      const firstJwtCreated = user && account;
      if (firstJwtCreated) {
        console.log(
          `[auth.js callback (JWT)] social login started - userId: ${user.id}`
        );
        const socialLoginResponse = await requestSocialLogin({
          provider: account.provider,
          providerId: account.providerAccountId,
          email: user.email,
          name: user.name,
          image: user.image,
        });

        // JWT 토큰에도 저장 (session 콜백에서 사용)
        token.userUuid = socialLoginResponse.user.uuid;
        token.backendAccessToken = socialLoginResponse.accessToken;
        token.backendRefreshToken = socialLoginResponse.refreshToken;
        token.backendTokenExpiredAt = socialLoginResponse.expiredAt;
        token.backendTokenIssuedAt = socialLoginResponse.issuedAt;

        // 프로필 정보 조회 후 토큰에 저장
        token.profile = await fetchUserProfile();

        return token;
      }

      // 세션 업데이트 요청 시 (클라이언트에서 update() 호출)
      // 프로필이 변경되었을 수 있으므로 다시 조회
      if (trigger === "update") {
        console.log(
          "[auth.js callback (JWT)] session update - refetching profile"
        );
        token.profile = await fetchUserProfile();
        return token;
      }

      // 토큰 갱신이 필요한 경우 (만료 시간 체크)
      if (
        token.backendTokenExpiredAt &&
        token.backendRefreshToken &&
        token.backendAccessToken
      ) {
        const expiredAt = new Date(token.backendTokenExpiredAt);
        const now = new Date();
        const bufferTime = 5 * 60 * 1000; // 5분 전에 갱신

        // 토큰이 만료되기 5분 전이면 갱신
        if (now.getTime() >= expiredAt.getTime() - bufferTime) {
          console.log("[auth.js callback (JWT)] refreshing backend token");
          const refreshedResponse = await refreshBackendToken({
            refreshToken: token.backendRefreshToken,
          });

          if (refreshedResponse.success) {
            token.backendAccessToken = refreshedResponse.data.accessToken;
            token.backendRefreshToken = refreshedResponse.data.refreshToken;
            token.backendTokenExpiredAt = refreshedResponse.data.expiredAt;
            token.backendTokenIssuedAt = refreshedResponse.data.issuedAt;
          }
        }
      }

      return token;
    },

    /**
     * Session Object 생성 단계
     *
     * server component + server action 모두 auth()를 자주 호출하므로
     * session callback이 지속적으로 호출됨.
     * 따라서 외부 API 호출 없이 JWT 토큰에 캐싱된 프로필을 사용.
     *
     * 프로필 업데이트가 필요한 경우:
     * 1. Server Action에서 프로필 수정 후 update() 호출
     * 2. jwt callback(trigger="update")에서 프로필 재조회
     */
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          userUuid: token.userUuid,
          profile: token.profile ?? null,
        },
      };
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 1 day
  },
} satisfies NextAuthConfig;
