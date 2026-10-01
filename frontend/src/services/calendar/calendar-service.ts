import { endOfMonth, format } from "date-fns";
import { serverApiGet } from "@/lib/server/api/client";
import { getCachedFamilyCategories } from "@/lib/server/cache";
import { getFamilyMembers } from "@/services/family/family-service";
import type { CalendarMonth } from "@/types/calendar";
import type { DailyStatsWithMembers, MemberAmount } from "@/types/dashboard";
import type { Expense } from "@/types/expense";
import type { Income } from "@/types/income";
import type { PaginationResponse } from "@/types/common";

const MONTH_TRANSACTION_LIMIT = 1000;

type ApiMemberAmount = Omit<MemberAmount, "amount"> & { amount: string | number };
type ApiDailyStats = Omit<DailyStatsWithMembers,
  "dailyStats" | "totalIncome" | "totalExpense" | "memberExpenseTotals"
> & {
  dailyStats: Array<{
    date: string;
    income: string | number;
    expense: string | number;
    memberExpenses: ApiMemberAmount[];
  }>;
  totalIncome: string | number;
  totalExpense: string | number;
  memberExpenseTotals: ApiMemberAmount[];
};
type ApiTransaction<T> = Omit<T, "amount"> & { amount: string | number };

function normalizeMemberAmount(member: ApiMemberAmount): MemberAmount {
  return { ...member, amount: Number(member.amount) };
}

export async function getCalendarMonth(
  familyUuid: string,
  year: number,
  month: number
): Promise<CalendarMonth> {
  const firstOfMonth = new Date(year, month - 1, 1);
  const startDate = format(firstOfMonth, "yyyy-MM-dd");
  const endDate = format(endOfMonth(firstOfMonth), "yyyy-MM-dd");
  const range = `startDate=${startDate}&endDate=${endDate}&size=${MONTH_TRANSACTION_LIMIT}`;
  const [daily, expenses, incomes, members, categories] = await Promise.all([
    serverApiGet<ApiDailyStats>(
      `/families/${familyUuid}/dashboard/daily-stats?year=${year}&month=${month}`
    ),
    serverApiGet<PaginationResponse<ApiTransaction<Expense>>>(
      `/families/${familyUuid}/expenses?${range}`
    ),
    serverApiGet<PaginationResponse<ApiTransaction<Income>>>(
      `/families/${familyUuid}/incomes?${range}`
    ),
    getFamilyMembers(familyUuid),
    getCachedFamilyCategories(familyUuid),
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
    daily: {
      ...daily,
      totalIncome: Number(daily.totalIncome),
      totalExpense: Number(daily.totalExpense),
      memberExpenseTotals: daily.memberExpenseTotals.map(normalizeMemberAmount),
      dailyStats: daily.dailyStats.map((day) => ({
        ...day,
        income: Number(day.income),
        expense: Number(day.expense),
        memberExpenses: day.memberExpenses.map(normalizeMemberAmount),
      })),
    },
    expenses: expenses.items.map((expense) => ({
      ...expense,
      amount: Number(expense.amount),
      category: categoryMap.get(expense.categoryUuid) ?? null,
    })),
    incomes: incomes.items.map((income) => ({
      ...income,
      amount: Number(income.amount),
      category: categoryMap.get(income.categoryUuid) ?? null,
    })),
    members,
  };
}
