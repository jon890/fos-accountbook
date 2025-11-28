import { UserProfile } from "@/types";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Naver from "next-auth/providers/naver";
import { serverApiGet } from "../api";
import { refreshBackendToken, requestSocialLogin } from "./backend-auth";

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
     */
    async jwt({ token, user, account }) {
      // 초기 로그인 시
      const firstJwtCreated = user && account;
      if (firstJwtCreated) {
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

          if (refreshedResponse) {
            // 새로 받은 토큰으로 업데이트
            token.backendAccessToken = refreshedResponse.accessToken;
            token.backendRefreshToken = refreshedResponse.refreshToken;
            token.backendTokenExpiredAt = refreshedResponse.expiredAt;
            token.backendTokenIssuedAt = refreshedResponse.issuedAt;
          }
        }
      }

      return token;
    },

    // 3. Session Object 생성 단계
    async session({ session, token }) {
      // 유저 프로필이 있다면 조회 후, session 데이터에 추가
      let userProfile: UserProfile | null = null;
      try {
        userProfile = await serverApiGet<UserProfile>("/users/me/profile");
      } catch (error) {}

      const newSession = {
        ...session,
        user: {
          ...session.user,
          userUuid: token.userUuid,
          profile: userProfile,
        },
      };

      return newSession;
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
