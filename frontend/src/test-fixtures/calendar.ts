import type { CalendarMonth } from "@/types/calendar";
import type { Expense } from "@/types/expense";
import type { Income } from "@/types/income";

export function calendarExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    uuid: "expense-1",
    userUuid: "wife",
    familyUuid: "family-1",
    categoryUuid: "category-1",
    category: null,
    amount: 32000,
    description: "점심",
    date: "2026-09-14T12:00:00",
    excludeFromBudget: false,
    createdAt: "2026-09-14T12:00:00",
    updatedAt: "2026-09-14T12:00:00",
    ...overrides,
  };
}

export function calendarIncome(overrides: Partial<Income> = {}): Income {
  return {
    ...calendarExpense(),
    uuid: "income-1",
    categoryUuid: "category-2",
    category: null,
    amount: 50000,
    description: "보너스",
    date: "2026-09-14T09:00:00",
    ...overrides,
  };
}

export function calendarMonth(overrides: Partial<CalendarMonth> = {}): CalendarMonth {
  return {
    year: 2026,
    month: 9,
    daily: {
      year: 2026,
      month: 9,
      dailyStats: [{ date: "2026-09-14", income: 50000, expense: 43000, memberExpenses: [{ userUuid: "wife", amount: 32000 }, { userUuid: "husband", amount: 11000 }] }],
      totalExpense: 99000,
      totalIncome: 120000,
      memberExpenseTotals: [{ userUuid: "husband", amount: 66000 }, { userUuid: "wife", amount: 33000 }],
    },
    members: [
      { userUuid: "wife", name: "아내", email: null, image: null, role: "OWNER", joinedAt: "2026-01-01" },
      { userUuid: "husband", name: "남편", email: null, image: null, role: "MEMBER", joinedAt: "2026-01-02" },
    ],
    expenses: [calendarExpense(), calendarExpense({ uuid: "expense-2", description: "다음 날 식사", date: "2026-09-15T12:00:00" })],
    incomes: [calendarIncome()],
    budgetSummary: {
      year: 2026,
      month: 9,
      total: { spent: 1180000, limit: 1800000 },
      living: { spent: 620000, limit: 1000000 },
      allocationExceeded: false,
      items: [
        { budgetItemUuid: "item-1", name: "남편 용돈", limit: 400000, spent: 150000 },
      ],
    },
    ...overrides,
  };
}
