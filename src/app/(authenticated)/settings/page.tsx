import { getFamiliesAction } from "@/app/actions/family/get-families-action";
import { getUserProfileAction } from "@/app/actions/user/get-user-profile-action";
import { SettingsPageClient } from "./_components/SettingsPageClient";
import { requireActionSuccess } from "@/lib/server/action-result-handler";

// 쿠키를 사용하므로 동적 렌더링 필요
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // 1. 사용자 프로필 조회 (없으면 백엔드에서 자동 생성)
  // 실패 시: 네트워크/인증 오류는 자동 처리, 기타는 "profile" 에러로 로그인
  const profile = await requireActionSuccess(await getUserProfileAction(), {
    fallbackErrorType: "profile",
  });

  // 2. 가족 목록 조회
  // 실패 시: 네트워크/인증 오류는 자동 처리, 기타는 가족 생성 페이지로
  const families = await requireActionSuccess(await getFamiliesAction(), {
    fallbackRedirect: "/families/create",
  });

  return (
    <SettingsPageClient
      families={families}
      defaultFamilyUuid={profile.defaultFamilyUuid}
    />
  );
}
