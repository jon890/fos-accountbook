import { serverEnv } from "@/lib/env/server.env";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getBackendJWT, refreshAccessToken } from "../api";

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

export const encodedSecret = padSecretKey(serverEnv.NEXTAUTH_SECRET);

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
export async function handleInitialLogin(
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
export async function handleTokenRefresh(
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
