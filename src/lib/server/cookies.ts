/**
 * 쿠키 관리 유틸리티
 * Next.js 15 Server Components/Actions에서 사용
 */

import { cookies } from "next/headers";

// 쿠키 키 상수
export const COOKIE_KEYS = {
  SELECTED_FAMILY_UUID: "selected_family_uuid",
} as const;

/**
 * 선택된 가족 UUID를 쿠키에 저장
 */
export async function setSelectedFamilyUuid(familyUuid: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_KEYS.SELECTED_FAMILY_UUID, familyUuid, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1년
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * 선택된 가족 UUID를 쿠키에서 가져오기
 */
export async function getSelectedFamilyUuid(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_KEYS.SELECTED_FAMILY_UUID);
  return cookie?.value || null;
}

/**
 * 선택된 가족 UUID 쿠키 삭제
 */
export async function clearSelectedFamilyUuid(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_KEYS.SELECTED_FAMILY_UUID);
}
