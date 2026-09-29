import { getDashboardStatsAction } from "@/actions/dashboard/get-dashboard-stats-action";
import { getMonthlyCategoryBreakdownAction } from "@/actions/dashboard/get-monthly-category-breakdown-action";
import { getRecentExpensesAction } from "@/actions/dashboard/get-recent-expenses-action";
import { getFamiliesAction } from "@/actions/family/get-families-action";
import { BudgetHeroCard } from "@/components/dashboard/BudgetHeroCard";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { CategoryDistribution } from "@/components/dashboard/CategoryDistribution";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { IncomeExpenseStats } from "@/components/dashboard/IncomeExpenseStats";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
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

  const [statsResult, recentExpensesResult, familiesResult, categoryBreakdownResult] =
    await Promise.all([
      getDashboardStatsAction(),
      getRecentExpensesAction(10),
      getFamiliesAction(),
      getMonthlyCategoryBreakdownAction(),
    ]);

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
  const categoryBreakdown = getActionDataOrDefault(categoryBreakdownResult, {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    totalExpense: 0,
    items: [],
  });

  const selectedFamily =
    families.find((f) => f.uuid === selectedFamilyUuid) || null;

  const members =
    selectedFamily?.members?.map((m) => ({
      uuid: m.uuid,
      name: m.userName ?? m.userEmail ?? "멤버",
      avatarUrl: m.userImage,
    })) ?? [];

  // KST 기준 일자 (서버 UTC 와 무관하게 사용자 시간대로 daysRemaining 계산)
  const todayKstDay = Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      day: "2-digit",
    }).format(new Date())
  );
  const lastDayOfMonth = new Date(statsData.year, statsData.month, 0).getDate();
  const daysRemaining = Math.max(0, lastDayOfMonth - todayKstDay);

  return (
    <>
      <DashboardHeader
        familyName={selectedFamily?.name ?? null}
        members={members}
        year={statsData.year}
        month={statsData.month}
      />
      <BudgetHeroCard
        remainingBudget={statsData.remainingBudget}
        monthlyExpense={statsData.monthlyExpense}
        budget={statsData.budget}
        daysRemaining={daysRemaining}
      />
      <IncomeExpenseStats
        monthlyIncome={statsData.monthlyIncome}
        monthlyExpense={statsData.monthlyExpense}
      />
      <CategoryDistribution breakdown={categoryBreakdown} />
      <RecentActivity expenses={recentExpenses} />
      <QuickActions />
      <div className="my-6">
        <CalendarView />
      </div>
    </>
  );
}
