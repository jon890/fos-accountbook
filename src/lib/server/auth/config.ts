import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/server/database/prisma";
import { SignJWT, jwtVerify } from "jose";
import { serverEnv } from "@/lib/env/server.env";

const BACKEND_API_URL = serverEnv.BACKEND_API_URL;

/**
 * JWT Secret Key (백엔드와 동일한 키 사용)
 */
const AUTH_SECRET = serverEnv.NEXTAUTH_SECRET;
const encodedSecret = new TextEncoder().encode(AUTH_SECRET);

/**
 * 백엔드 API에서 JWT 토큰 획득
 */
async function getBackendJWT(user: {
  email?: string | null;
  name?: string | null;
  image?: string | null;
}) {
  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        image: user.image,
      }),
    });

    if (!response.ok) {
      console.error(
        "Failed to get backend JWT:",
        response.status,
        response.statusText
      );
      return null;
    }

    const data = await response.json();

    // ApiSuccessResponse<AuthResponse> 형식에서 데이터 추출
    return data.data || data;
  } catch (error) {
    console.error("Error getting backend JWT:", error);
    return null;
  }
}

/**
 * JWT 토큰 갱신
 */
async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    if (!response.ok) {
      console.error("Failed to refresh token:", response.status);
      return null;
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

/**
 * Auth.js v5 Configuration
 */
export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
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
    async encode({ token, secret }) {
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
    async decode({ token, secret }) {
      if (!token) {
        return null;
      }

      try {
        const { payload } = await jwtVerify(token, encodedSecret, {
          algorithms: ["HS256"],
        });
        return payload;
      } catch (error) {
        console.error("JWT decode error:", error);
        return null;
      }
    },
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // 초기 로그인 시
      if (user && account) {
        // 백엔드에서 JWT 토큰 획득
        const backendAuth = await getBackendJWT({
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
    async signIn({ user, account, profile }) {
      // OAuth 로그인 시 계정 연결 처리
      if (account?.provider === "google") {
        try {
          // 이미 존재하는 사용자인지 확인
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { accounts: true },
          });

          if (existingUser) {
            // 이미 같은 제공자로 연결된 계정이 있는지 확인
            const existingAccount = existingUser.accounts.find(
              (acc) => acc.provider === account.provider
            );

            if (!existingAccount) {
              // 새 계정을 기존 사용자와 연결
              console.log(
                `Linking ${account.provider} account to existing user: ${user.email}`
              );
            }
          }

          return true;
        } catch (error) {
          console.error("OAuth sign-in error:", error);
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
