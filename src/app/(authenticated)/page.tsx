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
import {
  setSelectedFamilyUuid,
  getSelectedFamilyUuid,
} from "@/lib/server/cookies";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// 쿠키를 사용하므로 동적 렌더링 필요
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 1. 사용자 프로필 조회 (기본 가족 확인)
  const profileResult = await getUserProfileAction();

  // 디버깅: 프로필 조회 결과 확인
  if (!profileResult.success) {
    console.error("프로필 조회 실패:", profileResult);
  }

  if (profileResult.success && profileResult.data.defaultFamilyUuid) {
    // 🎯 기본 가족 있음 → 쿠키 설정하고 대시보드로
    const defaultFamilyUuid = profileResult.data.defaultFamilyUuid;

    // 쿠키 설정
    await setSelectedFamilyUuid(defaultFamilyUuid);

    // 쿠키 설정 확인 (모바일 환경에서 쿠키 설정이 실패할 수 있음)
    const savedFamilyUuid = await getSelectedFamilyUuid();
    if (savedFamilyUuid !== defaultFamilyUuid) {
      // 쿠키 설정 실패 시 다시 시도
      console.warn(
        `쿠키 설정 실패. 예상: ${defaultFamilyUuid}, 실제: ${savedFamilyUuid}`
      );
      await setSelectedFamilyUuid(defaultFamilyUuid);
    }

    // 쿠키 설정 후 캐시 재검증 (리다이렉트 전에 완료 보장)
    revalidatePath("/", "layout");

    redirect("/dashboard");
  }

  // 2. 기본 가족 없음 → 가족 선택 페이지로
  redirect("/families/select");
}
