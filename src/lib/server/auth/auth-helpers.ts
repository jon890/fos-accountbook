/**
 * 인증 관련 헬퍼 함수
 * Server Actions에서 공통으로 사용되는 인증 로직
 */

import { ActionError } from "@/lib/errors";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/**
 * 인증 확인 및 세션 반환
 * 인증되지 않은 경우 ActionError를 throw
 *
 * @returns 현재 세션
 * @throws ActionError.unauthorized() - 인증되지 않은 경우
 *
 * @example
 * ```typescript
 * export async function myAction() {
 *   const session = await requireAuth();
 *   // session.user.id를 사용할 수 있음
 * }
 * ```
 */
export async function requireAuth(): Promise<Session> {
  const session = await auth();

  if (!session?.user?.id) {
    throw ActionError.unauthorized();
  }

  return session;
}

/**
 * 인증 확인 및 세션 반환 (리다이렉트 버전)
 * 인증되지 않은 경우 로그인 페이지로 리다이렉트
 *
 * @param callbackUrl - 로그인 후 돌아올 URL (선택)
 *
 * @example
 * ```typescript
 * export async function myAction() {
 *   const session = await requireAuthOrRedirect('/my-page');
 *   // session.user.id를 사용할 수 있음
 * }
 * ```
 */
export async function requireAuthOrRedirect(
  callbackUrl?: string
): Promise<Session> {
  const session = await auth();

  if (!session?.user?.id) {
    const url = callbackUrl
      ? `/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/api/auth/signin";
    redirect(url);
  }

  return session;
}

/**
 * 선택된 가족 UUID 가져오기
 * 세션의 profile.defaultFamilyUuid를 반환
 *
 * @returns 선택된 가족 UUID 또는 null
 */
export async function getSelectedFamilyUuid(): Promise<string | null> {
  const session = await auth();
  return session?.user?.profile?.defaultFamilyUuid || null;
}
