import { getMonthlyCategoryBreakdown } from "@/services/dashboard/dashboard-service";
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

function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

function computeDelta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
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

  const breakdowns = await Promise.all(
    targets.map((t) => getMonthlyCategoryBreakdown(familyUuid, t.year, t.month)),
  );

  const points: MonthlyTrendPoint[] = breakdowns.map((b) => ({
    year: b.year,
    month: b.month,
    totalExpense: b.totalExpense,
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
  const [current, previous] = await Promise.all([
    getMonthlyCategoryBreakdown(familyUuid, year, month),
    getMonthlyCategoryBreakdown(familyUuid, prev.year, prev.month),
  ]);

  const prevByUuid = new Map(previous.items.map((i) => [i.categoryUuid, i.totalAmount]));

  const items: CategoryWithDelta[] = current.items.map((item) => {
    const previousAmount = prevByUuid.get(item.categoryUuid) ?? 0;
    return {
      categoryUuid: item.categoryUuid,
      name: item.name,
      icon: item.icon,
      totalAmount: item.totalAmount,
      percentage: item.percentage,
      deltaPercent: computeDelta(item.totalAmount, previousAmount),
    };
  });

  return {
    year: current.year,
    month: current.month,
    totalExpense: current.totalExpense,
    totalDelta: computeDelta(current.totalExpense, previous.totalExpense),
    items,
  };
}
