/**
 * Home Page - Server Component
 * 홈 페이지 (단순 리다이렉트 로직)
 *
 * 역할:
 * - 사용자 프로필 기반으로 적절한 페이지로 리다이렉트
 * - defaultFamilyUuid 있음 → /dashboard
 * - defaultFamilyUuid 없음 → /families/create (첫 가입 유저)
 *
 * 플로우:
 * / → [프로필 체크] → /dashboard or /families/create
 *
 * 참고:
 * - 백엔드에서 첫 가족 생성 시 자동으로 defaultFamilyUuid 설정
 * - 첫 가입 유저는 가족이 없으므로 바로 가족 생성 페이지로 이동
 */

import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await requireAuth();

  // 프로필이 없거나 defaultFamilyUuid가 없으면 첫 가입 유저로 간주
  const defaultFamilyUuid = session.user.profile?.defaultFamilyUuid;
  if (!defaultFamilyUuid) {
    // 첫 가입 유저는 바로 가족 생성 페이지로 이동
    redirect("/families/create");
  } else {
    redirect("/dashboard");
  }
}
