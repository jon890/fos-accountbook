/**
 * 인증 응답 타입
 */

import type { UserInfo } from "./user-info";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  issuedAt: string;
  expiredAt: string;
  user: UserInfo;
}
