/**
 * Auth.js v5 타입 확장
 * 
 * Auth.js v5에서는 타입 확장 방식이 개선되었습니다.
 * declare module을 사용하여 기본 타입을 확장합니다.
 */

import { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Session 타입 확장
   * 백엔드 JWT 토큰을 포함하도록 확장
   */
  interface Session {
    user: {
      id: string
      accessToken?: string
      refreshToken?: string
    } & DefaultSession["user"]
  }

  /**
   * User 타입 확장
   */
  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    accessToken?: string
    refreshToken?: string
  }
}

declare module "next-auth/jwt" {
  /**
   * JWT 타입 확장
   * 백엔드 토큰 정보 및 만료 시간 포함
   */
  interface JWT {
    sub?: string
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
  }
}
