import { getFamiliesAction } from "@/app/actions/family/get-families-action";
import { getUserProfileAction } from "@/app/actions/user/get-user-profile-action";
import { SettingsPageClient } from "@/components/settings/SettingsPageClient";
import { redirect } from "next/navigation";

// 쿠키를 사용하므로 동적 렌더링 필요
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // 1. 사용자 프로필 조회 (기본 가족 확인)
  const profileResult = await getUserProfileAction();

  // 2. 가족 목록 조회
  const familiesResult = await getFamiliesAction();

  if (!familiesResult.success) {
    // 네트워크 연결 오류 (서버 다운)
    if (familiesResult.error.code === "C004") {
      redirect(
        `/auth/signin?error=network&message=${encodeURIComponent(
          familiesResult.error.message
        )}`
      );
    }

    // 인증 오류
    if (
      familiesResult.error.code === "A001" ||
      familiesResult.error.code === "A002"
    ) {
      redirect(
        `/auth/signin?error=auth&message=${encodeURIComponent(
          familiesResult.error.message
        )}`
      );
    }

    // 기타 오류 (가족이 없음 등) → 가족 생성 페이지로
    redirect("/families/create");
  }

  return (
    <SettingsPageClient
      families={familiesResult.data}
      defaultFamilyUuid={
        profileResult.success ? profileResult.data.defaultFamilyUuid : null
      }
    />
  );
}
