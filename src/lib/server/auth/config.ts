import { serverEnv } from "@/lib/env/server.env";
import { SignJWT, jwtVerify } from "jose";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { cookies } from "next/headers";
import { getBackendJWT, refreshAccessToken } from "../api/backend-auth";

/**
 * JWT Secret Key (백엔드와 동일한 키 사용)
 * 키가 짧으면 64바이트로 패딩하여 HS512 호환성 보장
 */
const AUTH_SECRET = serverEnv.NEXTAUTH_SECRET;

/**
 * 시크릿 키를 HS512에 안전한 길이(64바이트)로 패딩
 */
function padSecretKey(secret: string): Uint8Array {
  const keyBytes = new TextEncoder().encode(secret);

  // HS512는 최소 64바이트 필요
  if (keyBytes.length < 64) {
    console.warn(
      `JWT secret key is too short (${keyBytes.length} bytes). Padding to 64 bytes for HS512 compatibility.`
    );

    // 키를 64바이트로 패딩 (반복)
    const paddedKey = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      paddedKey[i] = keyBytes[i % keyBytes.length];
    }
    return paddedKey;
  }

  return keyBytes;
}

const encodedSecret = padSecretKey(AUTH_SECRET);

/**
 * 백엔드 JWT 토큰에서 user UUID 추출
 *
 * 백엔드 JWT의 sub에는 User 테이블의 uuid 컬럼 값이 저장되어 있습니다.
 * (내부 ID가 아닌 UUID를 노출하여 보안 강화)
 */
async function extractUserUuidFromBackendToken(
  accessToken: string
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(accessToken, encodedSecret, {
      algorithms: ["HS512"], // 백엔드는 HS512 사용
    });
    return payload.sub || null;
  } catch (error) {
    console.error("Failed to decode backend access token:", error);
    return null;
  }
}

/**
 * 쿠키에 백엔드 토큰 저장
 */
async function saveBackendTokensToCookie(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const cookieStore = await cookies();
  const accessTokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
  const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일

  cookieStore.set("backend_access_token", accessToken, {
    httpOnly: true,
    secure: serverEnv.NODE_ENV === "production",
    sameSite: "lax",
    expires: accessTokenExpiresAt,
    path: "/",
  });

  cookieStore.set("backend_refresh_token", refreshToken, {
    httpOnly: true,
    secure: serverEnv.NODE_ENV === "production",
    sameSite: "lax",
    expires: refreshTokenExpiresAt,
    path: "/",
  });
}

/**
 * 초기 로그인 처리
 */
async function handleInitialLogin(
  token: Record<string, unknown>,
  user: { email?: string | null; name?: string | null; image?: string | null },
  account: { provider: string; providerAccountId: string }
): Promise<void> {
  // 백엔드에서 JWT 토큰 획득
  const backendAuth = await getBackendJWT({
    provider: account.provider,
    providerId: account.providerAccountId,
    email: user.email,
    name: user.name,
    image: user.image,
  });

  if (!backendAuth) {
    throw new Error("Failed to get backend authentication");
  }

  // 백엔드 accessToken에서 user UUID 추출
  const userUuid = await extractUserUuidFromBackendToken(
    backendAuth.accessToken
  );

  if (!userUuid) {
    throw new Error("Failed to extract user UUID from backend token");
  }

  // JWT payload에는 userUuid만 저장
  token.userUuid = userUuid;
  token.accessTokenExpires =
    Date.now() + (backendAuth.expiresIn || 86400) * 1000;

  // accessToken, refreshToken은 HTTP-only 쿠키로 별도 저장
  await saveBackendTokensToCookie(
    backendAuth.accessToken,
    backendAuth.refreshToken,
    backendAuth.expiresIn || 86400
  );
}

/**
 * 토큰 갱신 처리
 */
async function handleTokenRefresh(
  token: Record<string, unknown>
): Promise<void> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("backend_refresh_token")?.value;

  if (!refreshToken) {
    return;
  }

  const refreshedTokens = await refreshAccessToken(refreshToken);
  if (!refreshedTokens) {
    return;
  }

  // user UUID 추출
  const userUuid = await extractUserUuidFromBackendToken(
    refreshedTokens.accessToken
  );

  if (!userUuid) {
    console.error("Failed to extract user UUID from refreshed token");
    return;
  }

  token.userUuid = userUuid;
  token.accessTokenExpires =
    Date.now() + (refreshedTokens.expiresIn || 86400) * 1000;

  // 갱신된 토큰을 쿠키에 저장
  await saveBackendTokensToCookie(
    refreshedTokens.accessToken,
    refreshedTokens.refreshToken,
    refreshedTokens.expiresIn || 86400
  );
}

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

      return session;
    },
    async signIn({ user, account }) {
      // OAuth 로그인 시 백엔드 인증 검증
      if (account?.provider === "google") {
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
