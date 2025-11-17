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

import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  const defaultFamilyUuid = session?.user?.profile?.defaultFamilyUuid;

  if (!defaultFamilyUuid) {
    redirect("/families/select");
  } else {
    redirect("/dashboard");
  }
}
