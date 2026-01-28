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
import { getFamiliesAction } from "@/app/actions/family/get-families-action";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { getActionDataOrDefault } from "@/lib/server/action-result-handler";
import { auth } from "@/lib/server/auth";
import { getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }

  const selectedFamilyUuid = await getSelectedFamilyUuid();
  if (!selectedFamilyUuid) {
    redirect("/");
  }

  const [statsResult, recentExpensesResult, familiesResult] = await Promise.all(
    [
      getDashboardStatsAction(),
      getRecentExpensesAction(10),
      getFamiliesAction(),
    ],
  );

  const statsData = getActionDataOrDefault(statsResult, {
    monthlyExpense: 0,
    monthlyIncome: 0,
    remainingBudget: 0,
    familyMembers: 0,
    budget: 0,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const recentExpenses = getActionDataOrDefault(recentExpensesResult, []);

  const families = getActionDataOrDefault(familiesResult, []);

  const selectedFamily =
    families.find((f) => f.uuid === selectedFamilyUuid) || null;

  return (
    <DashboardClient recentExpenses={recentExpenses}>
      <WelcomeSection
        userName={session.user.name}
        familyName={selectedFamily?.name}
      />
      <StatsCards data={statsData} />
      <div className="my-6">
        <CalendarView />
      </div>
    </DashboardClient>
  );
}
