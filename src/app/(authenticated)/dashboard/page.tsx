/**
 * Dashboard Page - Server Component
 * 대시보드 전용 페이지
 *
 * 역할:
 * - 선택된 가족의 대시보드 데이터 표시
 * - 통계, 최근 지출 등 렌더링
 */

import { getDashboardStatsAction } from "@/app/actions/dashboard/get-dashboard-stats-action";
import { getRecentExpensesAction } from "@/app/actions/dashboard/get-recent-expenses-action";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { auth } from "@/lib/server/auth";
import { getSelectedFamilyUuid } from "@/lib/server/cookies";
import { redirect } from "next/navigation";

// 쿠키를 사용하므로 동적 렌더링 필요
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. 인증 확인
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }

  // 2. 선택된 가족 확인
  const selectedFamilyUuid = await getSelectedFamilyUuid();
  if (!selectedFamilyUuid) {
    // 선택된 가족이 없으면 홈으로 (홈에서 리다이렉트 처리)
    redirect("/");
  }

  // 3. 대시보드 데이터 병렬로 가져오기
  const [statsResult, recentExpensesResult] = await Promise.all([
    getDashboardStatsAction(),
    getRecentExpensesAction(10),
  ]);

  // 4. 기본값 설정 (데이터를 가져오지 못한 경우)
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

  // 5. 대시보드 렌더링
  return (
    <DashboardClient recentExpenses={recentExpenses}>
      <WelcomeSection userName={session.user.name} />
      <StatsCards data={statsData} />
    </DashboardClient>
  );
}
