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

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [statsResult, dailyResult, expensesResult, breakdownResult, trendResult] = await Promise.all([
    getDashboardStatsAction(),
    getMonthlyDailyStatsAction(year, month),
    getExpensesAction({ familyUuid: familyUuid, startDate, endDate, limit: 1000 }),
    getCategoryBreakdownWithDeltaAction(year, month),
    getMonthlyTrendAction(period, year, month),
  ]);

  return (
    <AnalyticsClient
      initialYear={year}
      initialMonth={month}
      initialStats={statsResult.success ? statsResult.data : null}
      initialDailyStats={dailyResult.success ? dailyResult.data : []}
      initialExpenses={expensesResult.success ? expensesResult.data.items : []}
      familyUuid={familyUuid}
      period={period}
      initialBreakdown={breakdownResult.success ? breakdownResult.data : null}
      initialTrend={trendResult.success ? trendResult.data : null}
    />
  );
}
