import { dailyStatsResponseSchema } from "@/lib/schemas/responses/calendar";
import { getRecurringExpensesResponseSchema } from "@/lib/schemas/responses/recurring-expense";
import {
  getExpensesResponseSchema,
  getIncomesResponseSchema,
} from "@/lib/schemas/responses/transaction";

const FAMILY_UUID = "11111111-1111-1111-1111-111111111111";
const USER_UUID = "22222222-2222-2222-2222-222222222222";
const CATEGORY_UUID = "33333333-3333-3333-3333-333333333331";
const createdAt = "2026-10-01T09:00:00";

/** 백엔드 지출 목록 항목. 목록 조회는 카테고리 없이 보내므로 category 가 null 이다. */
const expenseItem = {
  uuid: "55555555-5555-5555-5555-555555555551",
  familyUuid: FAMILY_UUID,
  userUuid: USER_UUID,
  categoryUuid: CATEGORY_UUID,
  category: null,
  amount: 12500,
  description: null,
  date: "2026-10-01T12:30:00",
  excludeFromBudget: false,
  createdAt,
  updatedAt: createdAt,
};

/** 백엔드 수입 목록 항목. category 는 CategoryInfo 이고 icon 은 null 일 수 있다. */
const incomeItem = {
  uuid: "55555555-5555-5555-5555-555555555552",
  familyUuid: FAMILY_UUID,
  userUuid: USER_UUID,
  categoryUuid: CATEGORY_UUID,
  category: { uuid: CATEGORY_UUID, name: "급여", color: "#22c55e", icon: null, type: "INCOME" },
  amount: 3000000,
  description: "10월 월급",
  date: "2026-10-01T09:00:00",
  createdAt,
  updatedAt: createdAt,
};

function page<T>(items: T[]) {
  return { items, totalElements: items.length, totalPages: 1, currentPage: 0 };
}

function without(source: Record<string, unknown>, key: string) {
  const copy = { ...source };
  delete copy[key];
  return copy;
}

function failedPaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues.map((issue) => issue.path.map(String).join(".")) ?? [];
}

describe("지출, 수입 목록 응답 스키마", () => {
  it("백엔드가 null 로 보내는 category 와 description 을 그대로 통과시킨다", () => {
    const result = getExpensesResponseSchema.safeParse(page([expenseItem]));

    expect(failedPaths(result)).toEqual([]);
    expect(result.data?.items[0]).toEqual(expenseItem);
  });

  it("수입 카테고리의 null icon 을 통과시키고 화면이 쓰지 않는 type 은 버린다", () => {
    const result = getIncomesResponseSchema.safeParse(page([incomeItem]));

    expect(failedPaths(result)).toEqual([]);
    expect(result.data?.items[0].category).toEqual({
      uuid: CATEGORY_UUID, name: "급여", color: "#22c55e", icon: null,
    });
  });

  it("빈 목록도 통과시킨다", () => {
    const result = getExpensesResponseSchema.safeParse(page([]));

    expect(result.success).toBe(true);
    expect(result.data?.items).toEqual([]);
  });

  it("amount 가 빠진 지출 항목은 그 경로로 실패한다", () => {
    expect(failedPaths(getExpensesResponseSchema.safeParse(page([without(expenseItem, "amount")])))).toEqual([
      "items.0.amount",
    ]);
  });

  it("description 키가 빠진 수입 항목은 실패한다", () => {
    expect(failedPaths(getIncomesResponseSchema.safeParse(page([without(incomeItem, "description")])))).toEqual([
      "items.0.description",
    ]);
  });

  it("문자열 금액은 백엔드 계약과 달라 실패한다", () => {
    expect(failedPaths(getExpensesResponseSchema.safeParse(page([{ ...expenseItem, amount: "12500" }])))).toEqual([
      "items.0.amount",
    ]);
  });
});

describe("달력 일별 통계 응답 스키마", () => {
  const dailyStats = {
    year: 2026,
    month: 10,
    dailyStats: [{
      date: "2026-10-01",
      income: 3000000,
      expense: 16200,
      memberExpenses: [{ userUuid: USER_UUID, amount: 16200 }],
    }],
    totalIncome: 3000000,
    totalExpense: 16200,
  };

  it("백엔드 DailyStatsResponse 를 통과시킨다", () => {
    const result = dailyStatsResponseSchema.safeParse(dailyStats);

    expect(failedPaths(result)).toEqual([]);
    expect(result.data).toEqual(dailyStats);
  });

  it("memberExpenseTotals 가 있어도 통과하고 결과에서 빠진다", () => {
    const result = dailyStatsResponseSchema.safeParse({
      ...dailyStats,
      memberExpenseTotals: [{ userUuid: USER_UUID, amount: 16200 }],
    });

    expect(failedPaths(result)).toEqual([]);
    expect(result.data).toEqual(dailyStats);
  });
});

describe("고정지출 목록 응답 스키마", () => {
  const recurringItem = {
    uuid: "55555555-5555-5555-5555-555555555553",
    familyUuid: FAMILY_UUID,
    categoryUuid: CATEGORY_UUID,
    category: { uuid: CATEGORY_UUID, name: "생활", color: "#6366f1", icon: "🏠", type: "EXPENSE" },
    userUuid: USER_UUID,
    name: "월세",
    amount: 850000,
    dayOfMonth: 25,
    status: "ACTIVE",
    generatedThisMonth: true,
    createdAt,
    updatedAt: createdAt,
  };

  it("가족 카테고리에 없어 category 가 null 인 항목도 통과시킨다", () => {
    const result = getRecurringExpensesResponseSchema.safeParse({
      totalMonthlyAmount: 850000,
      items: [recurringItem, { ...recurringItem, category: null }],
    });

    expect(failedPaths(result)).toEqual([]);
    expect(result.data?.items[0].category).toEqual({
      uuid: CATEGORY_UUID, name: "생활", color: "#6366f1", icon: "🏠",
    });
    expect(result.data?.items[1].category).toBeNull();
  });

  it("totalMonthlyAmount 가 빠지면 실패한다", () => {
    expect(failedPaths(getRecurringExpensesResponseSchema.safeParse({ items: [recurringItem] }))).toEqual([
      "totalMonthlyAmount",
    ]);
  });
});
