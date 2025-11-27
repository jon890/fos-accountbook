import { SUPPORTED_PROVIDERS } from "@/app/actions/auth/signin/constants";
import { ApiSuccessResponse } from "@/types";
import { UserProfile } from "@/types/next-auth";
import { jwtVerify, SignJWT } from "jose";
import { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { getBackendJWT, serverApiClient } from "../api";
import {
  encodedSecret,
  handleInitialLogin,
  handleTokenRefresh,
} from "./auth-method";
import { NaverProvider } from "./providers/naver";

/**
 * Auth.js v5 Configuration
 *
 * ⚠️ PrismaAdapter를 사용하지 않음!
 * - 사용자 정보는 백엔드 DB에서 단일 소스로 관리
 * - NextAuth는 JWT 세션만 관리
 * - 이메일 중복 문제 해결
 */
export const authConfig: NextAuthConfig = {
  providers: [Google, NaverProvider],
  jwt: {
    /**
     * 커스텀 JWT Encode: 암호화 없이 서명만 사용 (백엔드 호환)
     *
     * NextAuth v5는 기본적으로 JWT를 JWE(암호화)로 생성하지만,
     * 백엔드에서 JWS(서명된 JWT)만 검증할 수 있으므로 커스터마이징
     */
    async encode({ token }) {
      if (!token) {
        throw new Error("Token is required");
      }

      // HS256 알고리즘으로 JWT 생성 (암호화 없이 서명만)
      return await new SignJWT(token)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d") // 30일 만료
        .sign(encodedSecret);
    },
    /**
     * 커스텀 JWT Decode: 서명 검증 후 페이로드 반환
     */
    async decode({ token }) {
      if (!token) {
        return null;
      }

      try {
        const { payload } = await jwtVerify(token, encodedSecret, {
          algorithms: ["HS256"],
        });
        return payload;
      } catch {
        return null;
      }
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // 초기 로그인 시
      if (user && account && user.email) {
        await handleInitialLogin(token, user, account);
        return token;
      }

      // 토큰이 아직 유효한 경우
      if (
        token.accessTokenExpires &&
        Date.now() < (token.accessTokenExpires as number)
      ) {
        return token;
      }

      // 토큰 만료 시 갱신
      await handleTokenRefresh(token);
      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      // JWT payload의 userUuid를 session에 포함
      if (token.userUuid) {
        session.user.id = token.userUuid as string;
      }

      // 사용자 프로필 정보 조회 및 세션에 포함
      try {
        const response = await serverApiClient<ApiSuccessResponse<UserProfile>>(
          "/users/me/profile",
          {
            method: "GET",
          }
        );

        const profile = response.data;
        session.user.profile = {
          timezone: profile.timezone,
          language: profile.language,
          currency: profile.currency,
          defaultFamilyUuid: profile.defaultFamilyUuid,
        };
      } catch (error) {
        console.error("Failed to fetch user profile in session:", error);
        // 프로필 조회 실패 시 기본값 설정 (첫 가입 유저일 수 있음)
        session.user.profile = {
          timezone: "Asia/Seoul",
          language: "ko",
          currency: "KRW",
          defaultFamilyUuid: null,
        };
      }

      return session;
    },
    async signIn({ user, account }) {
      // OAuth 로그인 시 백엔드 인증 검증
      if (
        account?.provider &&
        SUPPORTED_PROVIDERS.includes(
          account.provider as (typeof SUPPORTED_PROVIDERS)[number]
        )
      ) {
        try {
          if (!user.email || !account.providerAccountId) {
            return false;
          }

          // 백엔드에서 JWT 토큰 획득 (로그인 시점에 검증)
          // 백엔드 register API는 이미 존재하는 사용자는 로그인 처리
          const backendAuth = await getBackendJWT({
            provider: account.provider,
            providerId: account.providerAccountId,
            email: user.email,
            name: user.name,
            image: user.image,
          });

          if (!backendAuth || !backendAuth.accessToken) {
            return false; // 로그인 실패
          }

          return true;
        } catch {
          return false;
        }
      }

      return true;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const AUTH_ROUTE = ["/auth/signin", "/auth/logout", "/auth/error"];
      const PUBLIC_ROUTES = [...AUTH_ROUTE];
      const isPublic = PUBLIC_ROUTES.includes(nextUrl.pathname);
      const isAuth = AUTH_ROUTE.includes(nextUrl.pathname);
      const isHome = "/" === nextUrl.pathname;

      if (isPublic) {
        if (isHome && isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }

        if (isAuth && isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }

        return true;
      } else {
        if (isLoggedIn) {
          return true;
        }

        return false;
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
