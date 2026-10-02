import { getDatePartsInTimezone } from "@/lib/utils/date-timezone";
import { getBudgetItemsAction } from "@/actions/budget-item/get-budget-items-action";
import { getFamilyCategoriesAction } from "@/actions/category/get-categories-action";
import { getDashboardStatsAction } from "@/actions/dashboard/get-dashboard-stats-action";
import { getMonthlyCategoryBreakdownAction } from "@/actions/dashboard/get-monthly-category-breakdown-action";
import { getMonthlyDailyStatsAction } from "@/actions/dashboard/get-monthly-daily-stats-action";
import { BudgetClient } from "@/app/(authenticated)/budget/_components/BudgetClient";
import { getActionDataOrDefault } from "@/lib/server/action-result-handler";
import { auth } from "@/lib/server/auth";
import { getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import type { BudgetItem } from "@/types/budget-item";
import type { CategoryResponse } from "@/types/category";
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

  const { year, month, day } = getDatePartsInTimezone(session.user.profile?.timezone);

  const [
    statsResult,
    dailyResult,
    breakdownResult,
    budgetItemsResult,
    categoriesResult,
  ] = await Promise.all([
    getDashboardStatsAction(),
    getMonthlyDailyStatsAction(year, month),
    getMonthlyCategoryBreakdownAction(),
    getBudgetItemsAction(),
    getFamilyCategoriesAction(),
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

  // 항목 구역만 실패 문구로 대체한다. 인증 실패는 getActionDataOrDefault 가 로그인으로 보낸다
  const budgetItems = getActionDataOrDefault<BudgetItem[] | null>(
    budgetItemsResult,
    null
  );
  const categories = getActionDataOrDefault<CategoryResponse[] | null>(
    categoriesResult,
    null
  );

  return (
    <BudgetClient
      budget={stats.budget}
      monthlyExpense={stats.monthlyExpense}
      remainingBudget={stats.remainingBudget}
      year={stats.year}
      month={stats.month}
      day={day}
      dailyExpenses={daily}
      categoryItems={breakdown.items}
      budgetItems={budgetItems ?? []}
      expenseCategories={(categories ?? []).filter(
        (category) => category.type === "EXPENSE"
      )}
      budgetItemsFailed={budgetItems === null || categories === null}
    />
  );
}
