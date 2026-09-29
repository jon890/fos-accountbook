import { getDashboardStatsAction } from "@/actions/dashboard/get-dashboard-stats-action";
import { getMonthlyCategoryBreakdownAction } from "@/actions/dashboard/get-monthly-category-breakdown-action";
import { getMonthlyDailyStatsAction } from "@/actions/dashboard/get-monthly-daily-stats-action";
import { BudgetClient } from "@/app/(authenticated)/budget/_components/BudgetClient";
import { getActionDataOrDefault } from "@/lib/server/action-result-handler";
import { auth } from "@/lib/server/auth";
import { getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { redirect } from "next/navigation";

export default async function BudgetPage() {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }

  const selectedFamilyUuid = await getSelectedFamilyUuid();
  if (!selectedFamilyUuid) {
    redirect("/");
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [statsResult, dailyResult, breakdownResult] = await Promise.all([
    getDashboardStatsAction(),
    getMonthlyDailyStatsAction(year, month),
    getMonthlyCategoryBreakdownAction(),
  ]);

  const stats = getActionDataOrDefault(statsResult, {
    monthlyExpense: 0,
    monthlyIncome: 0,
    remainingBudget: 0,
    familyMembers: 0,
    budget: 0,
    year,
    month,
  });

  const daily = getActionDataOrDefault(dailyResult, []);

  const breakdown = getActionDataOrDefault(breakdownResult, {
    year,
    month,
    totalExpense: 0,
    items: [],
  });

  return (
    <BudgetClient
      budget={stats.budget}
      monthlyExpense={stats.monthlyExpense}
      remainingBudget={stats.remainingBudget}
      year={stats.year}
      month={stats.month}
      dailyExpenses={daily}
      categoryItems={breakdown.items}
    />
  );
}
