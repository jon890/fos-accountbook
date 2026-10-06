import { endOfMonth, format } from "date-fns";
import { serverApiGet } from "@/lib/server/api/client";
import { getCachedFamilyCategories } from "@/lib/server/cache";
import { getBudgetSummary } from "@/services/budget-item/budget-item-service";
import { getFamilyMembers } from "@/services/family/family-service";
import type { CalendarMonth } from "@/types/calendar";
import { dailyStatsResponseSchema } from "@/lib/schemas/responses/calendar";
import {
  getExpensesResponseSchema,
  getIncomesResponseSchema,
} from "@/lib/schemas/responses/transaction";

const MONTH_TRANSACTION_LIMIT = 1000;

export async function getCalendarMonth(
  familyUuid: string,
  year: number,
  month: number
): Promise<CalendarMonth> {
  const firstOfMonth = new Date(year, month - 1, 1);
  const startDate = format(firstOfMonth, "yyyy-MM-dd");
  const endDate = format(endOfMonth(firstOfMonth), "yyyy-MM-dd");
  const range = `startDate=${startDate}&endDate=${endDate}&size=${MONTH_TRANSACTION_LIMIT}`;
  const [daily, expenses, incomes, members, categories, budgetSummary] = await Promise.all([
    serverApiGet(
      `/families/${familyUuid}/dashboard/daily-stats?year=${year}&month=${month}`,
      { schema: dailyStatsResponseSchema }
    ),
    serverApiGet(`/families/${familyUuid}/expenses?${range}`, {
      schema: getExpensesResponseSchema,
    }),
    serverApiGet(`/families/${familyUuid}/incomes?${range}`, {
      schema: getIncomesResponseSchema,
    }),
    getFamilyMembers(familyUuid),
    getCachedFamilyCategories(familyUuid),
    getBudgetSummary(familyUuid, year, month),
  ]);
  const lists = [
    { type: "expense", response: expenses },
    { type: "income", response: incomes },
  ];
  for (const { type, response } of lists) {
    if (response.totalElements > MONTH_TRANSACTION_LIMIT) {
      console.warn("[calendar] 월 거래 목록 조회 한도 초과", {
        type,
        year,
        month,
        totalElements: response.totalElements,
        loadedItems: response.items.length,
        limit: MONTH_TRANSACTION_LIMIT,
      });
    }
  }

  const categoryMap = new Map(categories.map((category) => [category.uuid, {
    uuid: category.uuid,
    name: category.name,
    icon: category.icon ?? "",
    color: category.color ?? "",
    excludeFromBudget: category.excludeFromBudget === true,
  }]));

  return {
    year,
    month,
    daily,
    expenses: expenses.items.map((expense) => ({
      ...expense,
      category: categoryMap.get(expense.categoryUuid) ?? null,
    })),
    incomes: incomes.items.map((income) => ({
      ...income,
      category: categoryMap.get(income.categoryUuid) ?? null,
    })),
    members,
    budgetSummary,
  };
}
