/** @jest-environment node */
import { getDashboardStats } from "@/services/dashboard/dashboard-service";
import { getCachedDashboardStats } from "@/lib/server/cache";

jest.mock("@/lib/server/api/client", () => ({ serverApiGet: jest.fn() }));
jest.mock("@/lib/server/cache", () => ({ getCachedDashboardStats: jest.fn(), getCachedFamilyCategories: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-09-30T16:00:00Z"));
});

afterEach(() => jest.useRealTimers());

it.each([
  ["Asia/Seoul", 10],
  ["America/New_York", 9],
  ["invalid", 10],
  [undefined, 10],
])("시간대 %s의 현재 월로 기존 통계 캐시를 조회한다", async (timezone, month) => {
  const stats = { monthlyExpense: 10, monthlyIncome: 20, remainingBudget: 90, familyMembers: 2, budget: 100, year: 2026, month };
  jest.mocked(getCachedDashboardStats).mockResolvedValue(stats);
  await expect(getDashboardStats("family", timezone)).resolves.toEqual(stats);
  expect(getCachedDashboardStats).toHaveBeenCalledWith("family", 2026, month);
});

it("캐시 조회 실패를 상위 Action에 전달한다", async () => {
  jest.mocked(getCachedDashboardStats).mockRejectedValue(new Error("조회 실패"));
  await expect(getDashboardStats("family")).rejects.toThrow("조회 실패");
});
