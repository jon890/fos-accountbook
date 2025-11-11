/**
 * Home Page - Server Component
 * 홈 페이지 (단순 리다이렉트 로직)
 *
 * 역할:
 * - 사용자 프로필 기반으로 적절한 페이지로 리다이렉트
 * - defaultFamilyUuid 있음 → /dashboard
 * - defaultFamilyUuid 없음 → /families/select
 *
 * 플로우:
 * / → [프로필 체크] → /dashboard or /families/select
 */

import { getUserProfileAction } from "@/app/actions/user/get-user-profile-action";
import { setSelectedFamilyUuid } from "@/lib/server/cookies";
import { redirect } from "next/navigation";

// 쿠키를 사용하므로 동적 렌더링 필요
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 1. 사용자 프로필 조회 (기본 가족 확인)
  const profileResult = await getUserProfileAction();

  if (profileResult.success && profileResult.data.defaultFamilyUuid) {
    // 🎯 기본 가족 있음 → 쿠키 설정하고 대시보드로
    await setSelectedFamilyUuid(profileResult.data.defaultFamilyUuid);
    redirect("/dashboard");
  }

  // 2. 기본 가족 없음 → 가족 선택 페이지로
  redirect("/families/select");
}
