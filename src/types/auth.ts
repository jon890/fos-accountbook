/**
 * 인증 관련 타입
 */

/**
 * 사용자 정보
 */
export interface UserInfo {
  id: string;
  uuid: string;
  name?: string;
  email: string;
  image?: string;
  createdAt: string;
}

/**
 * 인증 응답
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserInfo;
}

/**
 * 회원가입 요청
 */
export interface RegisterRequest {
  email: string;
  name?: string;
  image?: string;
}

/**
 * 로그인 요청
 */
export interface LoginRequest {
  email: string;
}

/**
 * 토큰 갱신 요청
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}
