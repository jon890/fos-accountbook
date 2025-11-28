import { AuthResponse, UserProfile } from "@/types";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Naver from "next-auth/providers/naver";
import { cookies } from "next/headers";
import { serverApiGet, serverApiPost } from "../api";

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
      if (user && account) {
        console.log("[auth.js callback (JWT)] backend social-login request");

        const data = {
          provider: account.provider,
          providerId: account.providerAccountId,
          email: user.email,
          name: user.name,
          image: user.image,
        };

        const responseData = await serverApiPost<AuthResponse>(
          "/auth/social-login",
          data
        );

        // todo 이 토큰을 쿠키에 저장하지 않고 사용할 방법?
        const cookieStore = await cookies();
        cookieStore.set("backend_access_token", responseData.accessToken, {
          httpOnly: true,
          secure: true,
          maxAge: 24 * 60 * 60,
        });
        cookieStore.set("backend_refresh_token", responseData.refreshToken, {
          httpOnly: true,
          secure: true,
          maxAge: 30 * 24 * 60 * 60,
        });
        token.userUuid = responseData.user.uuid;
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
          backendAccessToken: token.backendAccessToken,
          backendRefreshToken: token.backendRefreshToken,
          backendExpiresIn: token.backendExpiresIn,
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
