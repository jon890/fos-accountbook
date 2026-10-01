/**
 * 분석 페이지 — Server Component
 * 월별 지출/수입 통계 및 카테고리 분석
 */

import { getDashboardStatsAction } from "@/actions/dashboard/get-dashboard-stats-action";
import { getMonthlyDailyStatsAction } from "@/actions/dashboard/get-monthly-daily-stats-action";
import { getExpensesAction } from "@/actions/expense/get-expenses-action";
import { getCategoryBreakdownWithDeltaAction } from "@/actions/analytics/get-category-breakdown-with-delta-action";
import { getMonthlyTrendAction } from "@/actions/analytics/get-monthly-trend-action";
import { getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { auth } from "@/lib/server/auth";
import { getRecurringExpensesTotalAction } from "@/actions/recurring-expense";
import { BudgetHeroCard } from "@/components/dashboard/BudgetHeroCard";
import { IncomeExpenseStats } from "@/components/dashboard/IncomeExpenseStats";
import { handleActionError } from "@/lib/server/action-result-handler";
import type { ActionResult } from "@/lib/errors";
import { getDatePartsInTimezone } from "@/lib/utils/date-timezone";
import { formatCurrency } from "@/lib/utils/format";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "./_components/AnalyticsClient";

import { ANALYTICS_PERIODS, type AnalyticsPeriod } from "@/types/analytics";

interface AnalyticsSearchParams {
  period?: string;
}

function parsePeriod(raw: string | undefined): AnalyticsPeriod {
  return (ANALYTICS_PERIODS as readonly string[]).includes(raw ?? "")
    ? (raw as AnalyticsPeriod)
    : "m1";
}

function getAnalyticsData<T>(result: ActionResult<T>): T {
  if (result.success) {
    return result.data;
  }

  throw new Error(result.error.message);
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsSearchParams>;
}) {
  const resolved = await searchParams;
  const period = parsePeriod(resolved.period);
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const familyUuid = await getSelectedFamilyUuid();
  if (!familyUuid) redirect("/");

  const { year, month, day } = getDatePartsInTimezone(session.user.profile?.timezone);

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [statsResult, dailyResult, expensesResult, breakdownResult, trendResult, recurringResult] = await Promise.all([
    getDashboardStatsAction(),
    getMonthlyDailyStatsAction(year, month),
    getExpensesAction({ familyUuid: familyUuid, startDate, endDate, limit: 1000 }),
    getCategoryBreakdownWithDeltaAction(year, month),
    getMonthlyTrendAction(period, year, month),
    getRecurringExpensesTotalAction(),
  ]);

  const results: ActionResult<unknown>[] = [
    statsResult,
    dailyResult,
    expensesResult,
    breakdownResult,
    trendResult,
    recurringResult,
  ];
  for (const result of results) {
    if (result.success) continue;

    const isAuthError = result.error.code === "A001" || result.error.code === "A002";
    if (isAuthError) {
      handleActionError(result);
    }
  }

  const stats = getAnalyticsData(statsResult);
  const daily = getAnalyticsData(dailyResult);
  const expenses = getAnalyticsData(expensesResult);
  const breakdown = getAnalyticsData(breakdownResult);
  const trend = getAnalyticsData(trendResult);
  const recurringTotal = getAnalyticsData(recurringResult);
  const daysRemaining = Math.max(0, lastDay - day);

  return (
    <>
      <Link href="/budget" className="block" aria-label="예산 보기">
        <BudgetHeroCard
          remainingBudget={stats.remainingBudget}
          monthlyExpense={stats.monthlyExpense}
          budget={stats.budget}
          daysRemaining={daysRemaining}
        />
      </Link>
      <IncomeExpenseStats
        monthlyIncome={stats.monthlyIncome}
        monthlyExpense={stats.monthlyExpense}
      />
      <Link
        href="/transactions?tab=recurring"
        className="block bg-bg-elev rounded-[var(--radius-lg)] p-4 md:p-6 mb-6 shadow-[var(--shadow-default)]"
      >
        <p className="text-sm text-fg-muted">이달 고정비</p>
        <p className="num text-xl font-bold text-fg">{formatCurrency(recurringTotal)}</p>
      </Link>
      <AnalyticsClient
        initialYear={year}
        initialMonth={month}
        initialStats={stats}
        initialDailyStats={daily}
        initialExpenses={expenses.items}
        familyUuid={familyUuid}
        period={period}
        initialBreakdown={breakdown}
        initialTrend={trend}
      />
    </>
  );
}
