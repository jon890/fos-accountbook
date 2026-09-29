/**
 * Auth.js v5 타입 확장
 *
 * Auth.js v5에서는 타입 확장 방식이 개선되었습니다.
 * declare module을 사용하여 기본 타입을 확장합니다.
 */

import { DefaultSession } from "next-auth";
import "next-auth/jwt";
import { UserProfile } from "./auth";

declare module "next-auth" {
  /**
   * Session 타입 확장
   *
   * id: 사용자 UUID (백엔드 User 테이블의 uuid 컬럼)
   * profile: 사용자 프로필 정보 (시간대, 언어, 통화 등)
   */
  interface Session {
    user: {
      userUuid: string;
      profile?: UserProfile;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userUuid: string;
    backendAccessToken: string;
    backendRefreshToken: string;
    backendTokenExpiredAt: string;
    backendTokenIssuedAt: string;
    /** 사용자 프로필 정보 (jwt callback에서 캐싱) */
    profile: UserProfile | null;
    /** refresh 실패 표시 — 설정되면 jwt callback이 추가 refresh 재시도를 건너뜀 */
    error?: "RefreshAccessTokenError";
  }
}
