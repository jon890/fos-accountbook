import NextAuth from "next-auth";
import { authConfig } from "./config";

/**
 * Auth.js v5 exports
 * - handlers: API 라우트 핸들러 (GET, POST)
 * - auth: Server Component에서 세션 가져오기
 * - signIn: 로그인 함수
 * - signOut: 로그아웃 함수
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
