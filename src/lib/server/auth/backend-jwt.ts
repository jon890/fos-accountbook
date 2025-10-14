import { serverEnv } from "@/lib/env/server.env";

const BACKEND_API_URL = serverEnv.BACKEND_API_URL;

/**
 * 백엔드 JWT 응답 타입
 */
export interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user?: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
}

/**
 * 백엔드 API에서 JWT 토큰 획득
 *
 * NextAuth 로그인 시 백엔드에 사용자를 등록하고 JWT 토큰을 발급받습니다.
 */
export async function getBackendJWT(user: {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}): Promise<BackendAuthResponse | null> {
  try {
    console.log("🌐 백엔드 JWT 요청:", {
      url: `${BACKEND_API_URL}/auth/register`,
      userId: user.id,
      email: user.email,
    });

    const response = await fetch(`${BACKEND_API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: user.id, // NextAuth user.id 전달
        email: user.email,
        name: user.name,
        image: user.image,
      }),
    });

    console.log("🌐 백엔드 응답 상태:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ 백엔드 JWT 요청 실패:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return null;
    }

    const data = await response.json();
    console.log("🌐 백엔드 응답 데이터:", JSON.stringify(data, null, 2));

    // ApiSuccessResponse<AuthResponse> 형식에서 데이터 추출
    const result = data.data || data;
    console.log("🌐 추출된 JWT 데이터:", result);
    return result;
  } catch (error) {
    console.error("❌ 백엔드 JWT 요청 에러:", error);
    return null;
  }
}

/**
 * JWT 토큰 갱신
 *
 * Refresh Token을 사용하여 새로운 Access Token을 발급받습니다.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<BackendAuthResponse | null> {
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
