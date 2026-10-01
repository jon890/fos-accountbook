/** @jest-environment node */
jest.mock("@/lib/server/api/client", () => ({ serverApiGet: jest.fn() }));
jest.mock("@/lib/server/cache", () => ({ getCachedFamilyCategories: jest.fn() }));

import { serverApiGet } from "@/lib/server/api/client";
import { getCalendarMonth } from "@/services/calendar/calendar-service";
import { getCachedFamilyCategories } from "@/lib/server/cache";
import { calendarExpense, calendarIncome } from "@/test-fixtures/calendar";
import type { CategoryResponse } from "@/types/category";

const mockGet = jest.mocked(serverApiGet);
const daily = {
  year: 2024, month: 2,
  dailyStats: [{ date: "2024-02-01", income: "12000", expense: "3000", memberExpenses: [{ userUuid: "user-1", amount: "3000" }] }],
  totalIncome: "12000", totalExpense: "5000",
  memberExpenseTotals: [{ userUuid: "user-1", amount: "5000" }],
};

beforeEach(() => {
  mockGet.mockReset();
  jest.mocked(getCachedFamilyCategories).mockReset();
  jest.mocked(getCachedFamilyCategories).mockImplementation((familyUuid) => mockGet<CategoryResponse[]>(`/families/${familyUuid}/categories`));
  mockGet.mockImplementation(async (path) => {
    if (path.includes("daily-stats")) return daily;
    if (path.endsWith("members")) return [{ userUuid: "user-1", name: "이름" }];
    if (path.endsWith("categories")) return [
      { uuid: "category-1", name: "식비", icon: "🍚" },
      { uuid: "category-2", name: "급여", icon: "💰" },
    ];
    const transaction = path.includes("expenses") ? calendarExpense() : calendarIncome();
    return { items: [{ ...transaction, amount: "2000" }] };
  });
});

describe("달력 월 조회", () => {
  it.each([
    [1000, 1000, 0],
    [1001, 1000, 1],
    [1000, 1001, 1],
    [1500, 2000, 2],
  ])("지출 %s건과 수입 %s건의 조회 한도 초과만 경고한다", async (expenseCount, incomeCount, warnings) => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      mockGet.mockResolvedValueOnce(daily);
      mockGet.mockResolvedValueOnce({ items: [calendarExpense()], totalElements: expenseCount });
      mockGet.mockResolvedValueOnce({ items: [calendarIncome()], totalElements: incomeCount });
      const result = await getCalendarMonth("family-1", 2024, 2);

      expect(warn).toHaveBeenCalledTimes(warnings);
      if (expenseCount > 1000) {
        expect(warn).toHaveBeenCalledWith("[calendar] 월 거래 목록 조회 한도 초과", {
          type: "expense", year: 2024, month: 2, totalElements: expenseCount, loadedItems: 1, limit: 1000,
        });
      }
      if (incomeCount > 1000) {
        expect(warn).toHaveBeenCalledWith("[calendar] 월 거래 목록 조회 한도 초과", {
          type: "income", year: 2024, month: 2, totalElements: incomeCount, loadedItems: 1, limit: 1000,
        });
      }
      expect(result.expenses).toHaveLength(1);
      expect(result.incomes).toHaveLength(1);
    } finally {
      warn.mockRestore();
    }
  });
  it("다섯 경로를 조회하고 윤년 말일과 모든 금액을 변환한다", async () => {
    const result = await getCalendarMonth("family-1", 2024, 2);
    expect(mockGet.mock.calls.map(([path]) => path).sort()).toEqual([
      "/families/family-1/categories",
      "/families/family-1/dashboard/daily-stats?year=2024&month=2",
      "/families/family-1/expenses?startDate=2024-02-01&endDate=2024-02-29&size=1000",
      "/families/family-1/incomes?startDate=2024-02-01&endDate=2024-02-29&size=1000",
      "/families/family-1/members",
    ]);
    expect(result.daily).toEqual({
      year: 2024, month: 2,
      dailyStats: [{ date: "2024-02-01", income: 12000, expense: 3000, memberExpenses: [{ userUuid: "user-1", amount: 3000 }] }],
      totalIncome: 12000, totalExpense: 5000,
      memberExpenseTotals: [{ userUuid: "user-1", amount: 5000 }],
    });
    expect(result.expenses[0]).toEqual({ ...calendarExpense(), amount: 2000, category: { uuid: "category-1", name: "식비", icon: "🍚", color: "" } });
    expect(result.incomes[0]).toEqual({ ...calendarIncome(), amount: 2000, category: { uuid: "category-2", name: "급여", icon: "💰", color: "" } });
    expect(result.members).toEqual([{ userUuid: "user-1", name: "이름" }]);
  });

  it.each(["daily-stats", "expenses", "incomes", "members", "categories"])("%s 조회 실패를 전파한다", async (endpoint) => {
    const error = new Error("조회 실패");
    mockGet.mockImplementation(async (path) => {
      if (path.includes(endpoint)) throw error;
      if (path.includes("daily-stats")) return daily;
      if (path.endsWith("members")) return [];
      if (path.endsWith("categories")) return [];
      return { items: [] };
    });
    await expect(getCalendarMonth("family-1", 2024, 2)).rejects.toBe(error);
  });

  it("빈 월 응답과 12월 말일을 유지한다", async () => {
    mockGet.mockImplementation(async (path) => {
      if (path.includes("daily-stats")) return { year: 2026, month: 12, dailyStats: [], totalIncome: "0", totalExpense: "0", memberExpenseTotals: [] };
      if (path.endsWith("members")) return [];
      if (path.endsWith("categories")) return [];
      return { items: [] };
    });
    expect(await getCalendarMonth("family-1", 2026, 12)).toEqual({
      year: 2026, month: 12,
      daily: { year: 2026, month: 12, dailyStats: [], totalIncome: 0, totalExpense: 0, memberExpenseTotals: [] },
      expenses: [], incomes: [], members: [],
    });
    expect(mockGet).toHaveBeenCalledWith("/families/family-1/expenses?startDate=2026-12-01&endDate=2026-12-31&size=1000");
  });

  it("목록에 없는 카테고리는 null로 두어 기타 표시를 허용한다", async () => {
    jest.mocked(getCachedFamilyCategories).mockResolvedValue([]);
    const result = await getCalendarMonth("family-1", 2024, 2);
    expect(result.expenses[0].category).toBeNull();
    expect(result.incomes[0].category).toBeNull();
  });
});
