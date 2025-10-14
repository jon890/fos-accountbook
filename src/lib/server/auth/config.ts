import { serverEnv } from "@/lib/env/server.env";
import { SignJWT, jwtVerify } from "jose";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getBackendJWT, refreshAccessToken } from "../api/backend-auth";

/**
 * JWT Secret Key (백엔드와 동일한 키 사용)
 */
const AUTH_SECRET = serverEnv.NEXTAUTH_SECRET;
const encodedSecret = new TextEncoder().encode(AUTH_SECRET);

/**
 * Auth.js v5 Configuration
 *
 * ⚠️ PrismaAdapter를 사용하지 않음!
 * - 사용자 정보는 백엔드 DB에서 단일 소스로 관리
 * - NextAuth는 JWT 세션만 관리
 * - 이메일 중복 문제 해결
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: serverEnv.GOOGLE_CLIENT_ID,
      clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
    }),
  ],
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
      if (user && account && user.id) {
        // 백엔드에서 JWT 토큰 획득
        const backendAuth = await getBackendJWT({
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        });

        if (backendAuth) {
          token.accessToken = backendAuth.accessToken;
          token.refreshToken = backendAuth.refreshToken;
          token.accessTokenExpires =
            Date.now() + (backendAuth.expiresIn || 86400) * 1000; // expiresIn은 초 단위
        }
      }

      // 토큰이 아직 유효한 경우
      if (
        token.accessTokenExpires &&
        Date.now() < (token.accessTokenExpires as number)
      ) {
        return token;
      }

      // 토큰 만료 시 갱신
      if (token.refreshToken) {
        const refreshedTokens = await refreshAccessToken(
          token.refreshToken as string
        );

        if (refreshedTokens) {
          token.accessToken = refreshedTokens.accessToken;
          token.refreshToken = refreshedTokens.refreshToken;
          token.accessTokenExpires =
            Date.now() + (refreshedTokens.expiresIn || 86400) * 1000;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.accessToken = token.accessToken as string | undefined;
        session.user.refreshToken = token.refreshToken as string | undefined;
      }
      return session;
    },
    async signIn({ user, account }) {
      // OAuth 로그인 시 백엔드 인증 검증
      if (account?.provider === "google") {
        try {
          if (!user.id) {
            return false;
          }

          // 백엔드에서 JWT 토큰 획득 (로그인 시점에 검증)
          // 백엔드 register API는 이미 존재하는 사용자는 로그인 처리
          const backendAuth = await getBackendJWT({
            id: user.id,
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
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
};

/**
 * Auth.js v5 exports
 * - handlers: API 라우트 핸들러 (GET, POST)
 * - auth: Server Component에서 세션 가져오기
 * - signIn: 로그인 함수
 * - signOut: 로그아웃 함수
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
