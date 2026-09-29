/**
 * 인증 관련 헬퍼 함수
 * Server Actions에서 공통으로 사용되는 인증 로직
 */

import { ActionError } from "@/lib/errors";
import { getCachedSession } from "@/lib/server/cache";
import { getFamilies } from "@/services/family/family-service";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";

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
  const session = await getCachedSession();

  if (!session?.user?.userUuid) {
    throw ActionError.unauthorized();
  }

  return session;
}

/**
 * 인증 확인 및 세션 반환 (리다이렉트 버전)
 * 인증되지 않은 경우 로그인 페이지로 리다이렉트
 *
 * @param callbackUrl - 로그인 후 돌아올 URL (선택)
 */
export async function requireAuthOrRedirect(
  callbackUrl?: string
): Promise<Session> {
  const session = await getCachedSession();

  if (!session?.user?.userUuid) {
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
  const session = await getCachedSession();
  return session?.user?.profile?.defaultFamilyUuid ?? null;
}

/**
 * Multi-family 패턴 권한 검증 (ADR-F25 패턴 B).
 * 사용자가 해당 family 의 member 인지 확인. 미소속 시 entityNotFound throw.
 *
 * Single-family Action 은 `getSelectedFamilyUuid()` 비교로 충분 — 본 helper 는
 * settings 처럼 본인 속한 여러 가족 중 하나를 다루는 Action 전용.
 *
 * 주의: `getFamilies()` 는 매 호출마다 백엔드 페치 (request 단위 캐시 미적용).
 * 동일 request 안에서 다른 곳이 getFamilies 를 또 부르면 중복 왕복 발생 — 빈도
 * 낮은 Action 권한 검증 용도라 현재는 React cache() 미사용. 호출 빈도가
 * 높아지면 family-service 측에 cache() 도입 검토.
 */
export async function assertFamilyAccess(familyUuid: string): Promise<void> {
  const families = await getFamilies();
  if (!families.some((f) => f.uuid === familyUuid)) {
    throw ActionError.entityNotFound("가족", familyUuid);
  }
}
