/**
 * Home Page - Server Component
 * Next.js 15 Server Component 패턴 사용
 *
 * 플로우:
 * 1. getUserProfile() → defaultFamilyUuid 체크
 * 2. 있으면 → setSelectedFamilyUuid() → 대시보드 렌더링
 * 3. 없으면 → getFamilies() 조회
 *    - 가족 있음 → FamilySelector 렌더링
 *    - 가족 없음 → /families/create 리다이렉트
 */

import { getDashboardStatsAction } from "@/app/actions/dashboard/get-dashboard-stats-action";
import { getRecentExpensesAction } from "@/app/actions/dashboard/get-recent-expenses-action";
import { getFamiliesAction } from "@/app/actions/family/get-families-action";
import { getUserProfileAction } from "@/app/actions/user/get-user-profile-action";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { FamilySelectorPage } from "@/components/families/FamilySelectorPage";
import { auth } from "@/lib/server/auth";
import { setSelectedFamilyUuid } from "@/lib/server/cookies";
import { redirect } from "next/navigation";

// 쿠키를 사용하므로 동적 렌더링 필요
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Layout에서 이미 인증 체크 완료 ✅
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }

  // 1. 사용자 프로필 조회 (기본 가족 확인)
  const profileResult = await getUserProfileAction();

  if (profileResult.success && profileResult.data.defaultFamilyUuid) {
    // 🎯 기본 가족 있음 → 쿠키 설정하고 대시보드 렌더링
    await setSelectedFamilyUuid(profileResult.data.defaultFamilyUuid);

    // 대시보드 데이터 병렬로 가져오기
    const [statsResult, recentExpensesResult] = await Promise.all([
      getDashboardStatsAction(),
      getRecentExpensesAction(10),
    ]);

    // 기본값 설정 (데이터를 가져오지 못한 경우)
    const statsData = statsResult.success
      ? statsResult.data
      : {
          monthlyExpense: 0,
          monthlyIncome: 0,
          remainingBudget: 0,
          familyMembers: 0,
          budget: 0,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
        };

    const recentExpenses = recentExpensesResult.success
      ? recentExpensesResult.data
      : [];

    return (
      <DashboardClient recentExpenses={recentExpenses}>
        <WelcomeSection userName={session.user.name} />
        <StatsCards data={statsData} />
      </DashboardClient>
    );
  }

  // 2. 기본 가족 없음 → 가족 목록 조회
  const familiesResult = await getFamiliesAction();

  if (!familiesResult.success || familiesResult.data.length === 0) {
    // 가족 없음 → 생성 페이지로
    redirect("/families/create");
  }

  // 3. 가족 있지만 기본 가족 미설정 → 선택 화면
  return <FamilySelectorPage families={familiesResult.data} />;
}
