/** @jest-environment node */
jest.mock("@/lib/server/api/client", () => ({ serverApiGet: jest.fn() }));
jest.mock("@/lib/server/cache", () => ({
  getCachedDashboardStats: jest.fn(),
  getCachedFamilyCategories: jest.fn(),
}));

import { serverApiGet } from "@/lib/server/api/client";
import { dailyStatsResponseSchema } from "@/lib/schemas/responses/calendar";
import { ServerApiError } from "@/lib/server/api/types";
import { getMonthlyDailyStats } from "@/services/dashboard/dashboard-service";

const api = jest.mocked(serverApiGet);

beforeEach(() => api.mockReset());

describe("getMonthlyDailyStats", () => {
  it("일별 집계 경로를 호출하고 수입과 지출을 반환한다", async () => {
    const dailyStats = [
      { date: "2026-03-01", income: 50, expense: 20 },
      { date: "2026-03-02", income: 0, expense: 10 },
    ];
    api.mockResolvedValue({
      year: 2026,
      month: 3,
      dailyStats,
      totalIncome: 50,
      totalExpense: 30,
    });
    expect(await getMonthlyDailyStats("family", 2026, 3)).toEqual(dailyStats);
    expect(api).toHaveBeenCalledWith(
      "/families/family/dashboard/daily-stats?year=2026&month=3",
      expect.objectContaining({ schema: dailyStatsResponseSchema }),
    );
  });

  it("거래가 없는 달은 빈 배열이다", async () => {
    api.mockResolvedValue({ dailyStats: [] });
    expect(await getMonthlyDailyStats("family", 2026, 3)).toEqual([]);
  });

  it.each([new ServerApiError("failed", 500), new Error("network")])(
    "일반 실패는 원인을 그대로 전달한다: %s",
    async (error) => {
      api.mockRejectedValue(error);
      await expect(getMonthlyDailyStats("family", 2026, 3)).rejects.toBe(error);
    },
  );
  it("401은 전파한다", async () => {
    const error = new ServerApiError("expired", 401);
    api.mockRejectedValue(error);
    await expect(getMonthlyDailyStats("family", 2026, 3)).rejects.toBe(error);
  });
});
