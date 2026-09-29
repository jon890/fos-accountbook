import { getFamiliesAction } from "@/actions/family/get-families-action";
import { getUserProfileAction } from "@/actions/user/get-user-profile-action";
import { auth } from "@/lib/server/auth";
import { requireActionSuccess } from "@/lib/server/action-result-handler";
import { SettingsPageClient } from "./_components/SettingsPageClient";

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

  // 3. 세션에서 사용자 이름/이메일 조회
  const session = await auth();

  return (
    <SettingsPageClient
      families={families}
      defaultFamilyUuid={profile.defaultFamilyUuid}
      userName={session?.user?.name ?? null}
      userEmail={session?.user?.email ?? null}
    />
  );
}
