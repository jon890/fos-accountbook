import { dailyStatsResponseSchema } from "@/lib/schemas/responses/calendar";
import { categoryBreakdownResponseSchema } from "@/lib/schemas/responses/dashboard";
import { getExpensesResponseSchema } from "@/lib/schemas/responses/transaction";
import { getDatePartsInTimezone } from "@/lib/utils/date-timezone";
import { serverApiGet } from "@/lib/server/api/client";
import { ServerApiError } from "@/lib/server/api/types";
import {
  getCachedDashboardStats,
  getCachedFamilyCategories,
} from "@/lib/server/cache";
import type {
  DashboardStats,
  RecentExpense,
  MonthlyCategoryBreakdown,
} from "@/types/dashboard";

export interface DailyTransactionSummary {
  date: string;
  income: number;
  expense: number;
}

export async function getDashboardStats(
  familyUuid: string,
  timezone: string = "Asia/Seoul",
): Promise<DashboardStats> {
  const { year, month } = getDatePartsInTimezone(timezone);
  return getCachedDashboardStats(familyUuid, year, month);
}

export async function getMonthlyDailyStats(
  familyUuid: string,
  year: number,
  month: number,
): Promise<DailyTransactionSummary[]> {
  const result = await serverApiGet(
    `/families/${familyUuid}/dashboard/daily-stats?year=${year}&month=${month}`,
    { schema: dailyStatsResponseSchema },
  );
  return result.dailyStats.map(({ date, income, expense }) => ({
    date,
    income,
    expense,
  }));
}

export async function getMonthlyCategoryBreakdown(
  familyUuid: string,
  year: number,
  month: number,
): Promise<MonthlyCategoryBreakdown> {
  try {
    const result = await serverApiGet(
      `/families/${familyUuid}/dashboard/stats/category-breakdown?year=${year}&month=${month}&compareWithPrev=false`,
      { schema: categoryBreakdownResponseSchema },
    );
    return {
      year: result.year,
      month: result.month,
      totalExpense: result.totalExpense,
      items: result.items.map((item) => ({
        categoryUuid: item.categoryUuid,
        name: item.name ?? "Unknown",
        icon: item.icon ?? "💰",
        color: item.color ?? undefined,
        totalAmount: item.totalAmount,
        percentage: Math.round(item.percentage),
      })),
    };
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 401) {
      throw error;
    }

    return { year, month, totalExpense: 0, items: [] };
  }
}

export async function getRecentExpenses(
  familyUuid: string,
  limit: number = 10,
): Promise<RecentExpense[]> {
  const expensesPage = await serverApiGet(
    `/families/${familyUuid}/expenses?page=0&size=${limit}&sort=-date`,
    { schema: getExpensesResponseSchema },
  );

  const categories = await getCachedFamilyCategories(familyUuid);
  const categoryMap = new Map(categories.map((cat) => [cat.uuid, cat]));

  return expensesPage.items.map((expense) => {
    const category = categoryMap.get(expense.categoryUuid);
    return {
      id: expense.uuid,
      uuid: expense.uuid,
      amount: String(expense.amount),
      description: expense.description || null,
      date: expense.date,
      category: {
        uuid: expense.categoryUuid,
        name: category?.name || "Unknown",
        color: category?.color,
        icon: category?.icon || "💰",
      },
    };
  });
}
