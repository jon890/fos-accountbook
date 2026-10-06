import {
  categoryBreakdownResponseSchema,
  monthlyTrendResponseSchema,
  type CategoryBreakdownResponse,
  type MonthlyTrendResponse,
} from "@/lib/schemas/responses/dashboard";
import { serverApiGet } from "@/lib/server/api/client";
import { ServerApiError } from "@/lib/server/api/types";
import type {
  AnalyticsPeriod,
  CategoryBreakdownWithDelta,
  CategoryWithDelta,
  MonthlyTrend,
  MonthlyTrendPoint,
} from "@/types/analytics";

const PERIOD_TO_MONTHS: Record<AnalyticsPeriod, number> = {
  m1: 1,
  m3: 3,
  m6: 6,
  y1: 12,
};

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function emptyOnFailure<T>(fallback: T): (error: unknown) => T {
  return (error) => {
    if (error instanceof ServerApiError && error.status === 401) {
      throw error;
    }

    return fallback;
  };
}

function getPreviousMonth(
  year: number,
  month: number,
): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }

  return { year, month: month - 1 };
}

function computeDelta(current: number, previous: number): number | null {
  if (previous <= 0) {
    return null;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export async function getMonthlyTrend(
  familyUuid: string,
  period: AnalyticsPeriod,
  refYear: number,
  refMonth: number,
): Promise<MonthlyTrend> {
  const months = PERIOD_TO_MONTHS[period];
  const targets: Array<{ year: number; month: number }> = [];
  let cur = { year: refYear, month: refMonth };
  for (let i = 0; i < months; i += 1) {
    targets.unshift({ year: cur.year, month: cur.month });
    cur = getPreviousMonth(cur.year, cur.month);
  }

  const first = targets[0];
  const response = await serverApiGet(
    `/families/${familyUuid}/dashboard/stats/monthly-trend?from=${monthKey(first.year, first.month)}&to=${monthKey(refYear, refMonth)}`,
    { schema: monthlyTrendResponseSchema },
  ).catch(emptyOnFailure<MonthlyTrendResponse>({ points: [], average: 0 }));
  const amounts = new Map(
    response.points.map((point) => [
      monthKey(point.year, point.month),
      point.totalExpense,
    ]),
  );

  const points: MonthlyTrendPoint[] = targets.map((target) => ({
    ...target,
    totalExpense: amounts.get(monthKey(target.year, target.month)) ?? 0,
  }));

  const total = points.reduce((sum, p) => sum + p.totalExpense, 0);
  const average = points.length > 0 ? Math.round(total / points.length) : 0;

  return { period, points, average };
}

export async function getCategoryBreakdownWithDelta(
  familyUuid: string,
  year: number,
  month: number,
): Promise<CategoryBreakdownWithDelta> {
  const prev = getPreviousMonth(year, month);
  const [current, trend] = await Promise.all([
    serverApiGet(
      `/families/${familyUuid}/dashboard/stats/category-breakdown?year=${year}&month=${month}&compareWithPrev=true`,
      { schema: categoryBreakdownResponseSchema },
    ).catch(
      emptyOnFailure<CategoryBreakdownResponse>({
        year,
        month,
        totalExpense: 0,
        items: [],
      }),
    ),
    serverApiGet(
      `/families/${familyUuid}/dashboard/stats/monthly-trend?from=${monthKey(prev.year, prev.month)}&to=${monthKey(year, month)}`,
      { schema: monthlyTrendResponseSchema },
    ).catch(emptyOnFailure<MonthlyTrendResponse>({ points: [], average: 0 })),
  ]);

  const amounts = new Map(
    trend.points.map((point) => [
      monthKey(point.year, point.month),
      point.totalExpense,
    ]),
  );
  const currentTotal = amounts.get(monthKey(year, month)) ?? 0;
  const previousTotal = amounts.get(monthKey(prev.year, prev.month)) ?? 0;

  const items: CategoryWithDelta[] = current.items.map((item) => {
    return {
      categoryUuid: item.categoryUuid,
      name: item.name ?? "Unknown",
      icon: item.icon ?? "💰",
      totalAmount: item.totalAmount,
      percentage: Math.round(item.percentage),
      deltaPercent:
        item.deltaPercent == null ? null : Math.round(item.deltaPercent),
      isNew: item.previousAmount === 0 && item.totalAmount > 0,
    };
  });

  return {
    year: current.year,
    month: current.month,
    totalExpense: current.totalExpense,
    totalDelta: computeDelta(currentTotal, previousTotal),
    items,
  };
}
