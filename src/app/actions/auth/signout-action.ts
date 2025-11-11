"use server";

import { signOut } from "@/lib/server/auth";
import { cookies } from "next/headers";

/**
 * 로그아웃 Server Action
 *
 * 역할:
 * 1. 백엔드 토큰 쿠키 제거
 * 2. 선택된 가족 쿠키 제거
 * 3. NextAuth.js 관련 쿠키 제거
 * 4. NextAuth signOut 호출
 */
export async function signOutAction(): Promise<void> {
  const cookieStore = await cookies();

  // 1. 우리가 관리하는 쿠키 제거
  const ourCookies = [
    "backend_access_token",
    "backend_refresh_token",
    "selected_family_uuid",
  ];

  ourCookies.forEach((cookieName) => {
    cookieStore.delete(cookieName);
  });

  // 2. NextAuth.js 관련 쿠키 제거
  // (NextAuth의 signOut이 session-token은 자동 제거하지만, 나머지도 정리)
  const nextAuthCookies = [
    "authjs.callback-url",
    "authjs.csrf-token",
    "authjs.pkce.code_verifier",
  ];

  nextAuthCookies.forEach((cookieName) => {
    try {
      cookieStore.delete(cookieName);
    } catch (error) {
      // 쿠키가 없을 수 있으므로 에러는 무시
      console.debug(`Failed to delete cookie: ${cookieName}`, error);
    }
  });

  // 3. NextAuth signOut 호출 (세션 무효화 + 로그인 페이지로 리다이렉트)
  await signOut({ redirectTo: "/auth/signin" });
}

