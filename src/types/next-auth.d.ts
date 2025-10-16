/**
 * Auth.js v5 타입 확장
 *
 * Auth.js v5에서는 타입 확장 방식이 개선되었습니다.
 * declare module을 사용하여 기본 타입을 확장합니다.
 */

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Session 타입 확장
   *
   * id: 사용자 UUID (백엔드 User 테이블의 uuid 컬럼)
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  /**
   * User 타입 확장
   */
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  /**
   * JWT 타입 확장
   *
   * userUuid: 백엔드에서 발급한 JWT의 sub (사용자 ID)
   * accessTokenExpires: 백엔드 Access Token 만료 시간 (토큰 갱신 판단용)
   *
   * ⚠️ accessToken과 refreshToken은 HTTP-only 쿠키로 별도 관리됨
   */
  interface JWT {
    sub?: string;
    userUuid?: string;
    accessTokenExpires?: number;
  }
}
