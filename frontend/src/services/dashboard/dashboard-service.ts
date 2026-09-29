import { endOfMonth, format, parseISO } from "date-fns";
import { serverApiGet } from "@/lib/server/api/client";
import { getCachedDashboardStats, getCachedFamilyCategories } from "@/lib/server/cache";
import type { DashboardStats, RecentExpense, MonthlyCategoryBreakdown } from "@/types/dashboard";
import type { ExpenseResponse } from "@/types/expense";
import type { PaginationResponse } from "@/types/common";

const MONTHLY_FETCH_PAGE_SIZE = 1000;

interface RawExpenseResponse {
  uuid: string;
  amount: number;
  date: string;
  categoryName: string;
  categoryUuid?: string;
}

interface RawIncomeResponse {
  uuid: string;
  amount: number;
  date: string;
  source: string;
}

export interface DailyTransactionSummary {
  date: string;
  income: number;
  expense: number;
}

export async function getDashboardStats(
  familyUuid: string
): Promise<DashboardStats> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return getCachedDashboardStats(familyUuid, year, month);
}

export async function getMonthlyDailyStats(
  familyUuid: string,
  year: number,
  month: number
): Promise<DailyTransactionSummary[]> {
  const firstOfMonth = new Date(year, month - 1, 1);
  const startDate = format(firstOfMonth, "yyyy-MM-dd");
  const endDate = format(endOfMonth(firstOfMonth), "yyyy-MM-dd");

  const [expensesResult, incomesResult] = await Promise.all([
    serverApiGet<{ items: RawExpenseResponse[] }>(
      `/families/${familyUuid}/expenses?size=${MONTHLY_FETCH_PAGE_SIZE}&startDate=${startDate}&endDate=${endDate}`
    ).catch(() => ({ items: [] as RawExpenseResponse[] })),
    serverApiGet<{ items: RawIncomeResponse[] }>(
      `/families/${familyUuid}/incomes?size=${MONTHLY_FETCH_PAGE_SIZE}&startDate=${startDate}&endDate=${endDate}`
    ).catch(() => ({ items: [] as RawIncomeResponse[] })),
  ]);

  const dailyMap = new Map<string, { income: number; expense: number }>();

  if (expensesResult?.items) {
    expensesResult.items.forEach((expense) => {
      const dateStr = format(parseISO(expense.date), "yyyy-MM-dd");
      const current = dailyMap.get(dateStr) || { income: 0, expense: 0 };
      current.expense += expense.amount;
      dailyMap.set(dateStr, current);
    });
  }

  if (incomesResult?.items) {
    incomesResult.items.forEach((income) => {
      const dateStr = format(parseISO(income.date), "yyyy-MM-dd");
      const current = dailyMap.get(dateStr) || { income: 0, expense: 0 };
      current.income += income.amount;
      dailyMap.set(dateStr, current);
    });
  }

  return Array.from(dailyMap.entries()).map(([date, stats]) => ({
    date,
    income: stats.income,
    expense: stats.expense,
  }));
}

export async function getMonthlyCategoryBreakdown(
  familyUuid: string,
  year: number,
  month: number
): Promise<MonthlyCategoryBreakdown> {
  const firstOfMonth = new Date(year, month - 1, 1);
  const startDate = format(firstOfMonth, "yyyy-MM-dd");
  const endDate = format(endOfMonth(firstOfMonth), "yyyy-MM-dd");

  const [expensesResult, categories] = await Promise.all([
    serverApiGet<{ items: RawExpenseResponse[] }>(
      `/families/${familyUuid}/expenses?size=${MONTHLY_FETCH_PAGE_SIZE}&startDate=${startDate}&endDate=${endDate}`
    ).catch(() => ({ items: [] as RawExpenseResponse[] })),
    getCachedFamilyCategories(familyUuid),
  ]);

  const categoryMap = new Map(categories.map((cat) => [cat.uuid, cat]));
  const amountByCategory = new Map<string, number>();

  for (const expense of expensesResult?.items ?? []) {
    if (!Number.isFinite(expense.amount) || expense.amount <= 0) continue;
    if (!expense.categoryUuid) continue;
    amountByCategory.set(
      expense.categoryUuid,
      (amountByCategory.get(expense.categoryUuid) ?? 0) + expense.amount
    );
  }

  const totalExpense = Array.from(amountByCategory.values()).reduce(
    (sum, amt) => sum + amt,
    0
  );

  const items = Array.from(amountByCategory.entries())
    .map(([categoryUuid, totalAmount]) => {
      const cat = categoryMap.get(categoryUuid);
      return {
        categoryUuid,
        name: cat?.name ?? "Unknown",
        icon: cat?.icon ?? "💰",
        color: cat?.color,
        totalAmount,
        percentage:
          totalExpense > 0
            ? Math.round((totalAmount / totalExpense) * 100)
            : 0,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return { year, month, totalExpense, items };
}

export async function getRecentExpenses(
  familyUuid: string,
  limit: number = 10
): Promise<RecentExpense[]> {
  const expensesPage = await serverApiGet<PaginationResponse<ExpenseResponse>>(
    `/families/${familyUuid}/expenses?page=0&size=${limit}&sort=-date`
  );

  const categories = await getCachedFamilyCategories(familyUuid);
  const categoryMap = new Map(categories.map((cat) => [cat.uuid, cat]));

  return expensesPage.items.map((expense) => {
    const category = categoryMap.get(expense.categoryUuid);
    return {
      id: expense.uuid,
      uuid: expense.uuid,
      amount: expense.amount,
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
