/** @jest-environment node */
jest.mock("@/lib/server/api/client", () => ({ serverApiGet: jest.fn() }));
jest.mock("@/lib/server/cache", () => ({
  getCachedDashboardStats: jest.fn(),
  getCachedFamilyCategories: jest.fn(),
}));

import { serverApiGet } from "@/lib/server/api/client";
import {
  categoryBreakdownResponseSchema,
  monthlyTrendResponseSchema,
} from "@/lib/schemas/responses/dashboard";
import {
  ResponseValidationError,
  ServerApiError,
} from "@/lib/server/api/types";
import {
  getMonthlyTrend,
  getCategoryBreakdownWithDelta,
} from "@/services/analytics/analytics-service";

const api = jest.mocked(serverApiGet);

beforeEach(() => api.mockReset());

const breakdown = {
  year: 2026,
  month: 5,
  totalExpense: 180,
  items: [
    {
      categoryUuid: "food",
      name: "식비",
      icon: "🍔",
      totalAmount: 120,
      percentage: 66.67,
      deltaPercent: 20.49,
    },
    {
      categoryUuid: "bus",
      name: null,
      icon: null,
      totalAmount: 60,
      percentage: 33.33,
      deltaPercent: -25.51,
    },
    {
      categoryUuid: "new",
      name: "신규",
      icon: "📦",
      totalAmount: 0,
      percentage: 0,
      deltaPercent: null,
    },
  ],
};
const trend = {
  points: [
    { year: 2026, month: 4, totalExpense: 150 },
    { year: 2026, month: 5, totalExpense: 180 },
  ],
  average: 165,
};

describe("getMonthlyTrend", () => {
  it("연도 경계를 넘는 12개월을 한 번 조회하고 빈 달과 평균을 보충한다", async () => {
    api.mockResolvedValue({
      points: [
        { year: 2025, month: 3, totalExpense: 120 },
        { year: 2026, month: 2, totalExpense: 181 },
      ],
      average: 151,
    });
    const result = await getMonthlyTrend("family", "y1", 2026, 2);
    expect(api).toHaveBeenCalledTimes(1);
    expect(api).toHaveBeenCalledWith(
      "/families/family/dashboard/stats/monthly-trend?from=2025-03&to=2026-02",
      expect.objectContaining({ schema: monthlyTrendResponseSchema }),
    );
    expect(result).toEqual({
      period: "y1",
      points: [
        { year: 2025, month: 3, totalExpense: 120 },
        ...Array.from({ length: 9 }, (_, index) => ({
          year: 2025,
          month: index + 4,
          totalExpense: 0,
        })),
        { year: 2026, month: 1, totalExpense: 0 },
        { year: 2026, month: 2, totalExpense: 181 },
      ],
      average: 25,
    });
  });

  it("빈 한 달의 점과 평균은 0이다", async () => {
    api.mockResolvedValue({ points: [], average: 0 });
    expect(await getMonthlyTrend("family", "m1", 2026, 5)).toEqual({
      period: "m1",
      points: [{ year: 2026, month: 5, totalExpense: 0 }],
      average: 0,
    });
  });

  it.each([
    new ServerApiError("failed", 500),
    new Error("network"),
    new ResponseValidationError("/families/:uuid/dashboard/stats/monthly-trend", [
      { path: "points.0.totalExpense", code: "invalid_type" },
    ]),
  ])(
    "일반 실패와 응답 계약 위반에도 세 달의 점을 유지한다: %s",
    async (error) => {
      api.mockRejectedValue(error);
      expect(await getMonthlyTrend("family", "m3", 2026, 5)).toEqual({
        period: "m3",
        points: [
          { year: 2026, month: 3, totalExpense: 0 },
          { year: 2026, month: 4, totalExpense: 0 },
          { year: 2026, month: 5, totalExpense: 0 },
        ],
        average: 0,
      });
    },
  );
  it("401은 전파한다", async () => {
    const error = new ServerApiError("expired", 401);
    api.mockRejectedValue(error);
    await expect(getMonthlyTrend("family", "m1", 2026, 5)).rejects.toBe(error);
  });
});

describe("getCategoryBreakdownWithDelta", () => {
  function mockResponses(
    categoryResult: unknown = breakdown,
    trendResult: unknown = trend,
  ) {
    api.mockImplementation(async (path) => {
      const result = path.includes("category-breakdown")
        ? categoryResult
        : trendResult;
      if (result instanceof Error) {
        throw result;
      }

      return result as never;
    });
  }
  it("양수·음수 비율과 총액 대비를 반올림하고 null 항목을 변환한다", async () => {
    mockResponses();
    expect(await getCategoryBreakdownWithDelta("family", 2026, 5)).toEqual({
      year: 2026,
      month: 5,
      totalExpense: 180,
      totalDelta: 20,
      items: [
        {
          categoryUuid: "food",
          name: "식비",
          icon: "🍔",
          totalAmount: 120,
          percentage: 67,
          deltaPercent: 20,
        },
        {
          categoryUuid: "bus",
          name: "Unknown",
          icon: "💰",
          totalAmount: 60,
          percentage: 33,
          deltaPercent: -26,
        },
        {
          categoryUuid: "new",
          name: "신규",
          icon: "📦",
          totalAmount: 0,
          percentage: 0,
          deltaPercent: null,
        },
      ],
    });
    expect(api).toHaveBeenCalledWith(
      "/families/family/dashboard/stats/category-breakdown?year=2026&month=5&compareWithPrev=true",
      expect.objectContaining({ schema: categoryBreakdownResponseSchema }),
    );
    expect(api).toHaveBeenCalledWith(
      "/families/family/dashboard/stats/monthly-trend?from=2026-04&to=2026-05",
      expect.objectContaining({ schema: monthlyTrendResponseSchema }),
    );
  });

  it("전월 점이 없으면 totalDelta는 null이다", async () => {
    mockResponses(breakdown, { points: [trend.points[1]], average: 180 });
    expect(
      (await getCategoryBreakdownWithDelta("family", 2026, 5)).totalDelta,
    ).toBeNull();
  });

  it("이번 달 점이 없으면 총액 대비는 -100이다", async () => {
    mockResponses(
      { year: 2026, month: 5, totalExpense: 0, items: [] },
      { points: [trend.points[0]], average: 150 },
    );
    expect(
      (await getCategoryBreakdownWithDelta("family", 2026, 5)).totalDelta,
    ).toBe(-100);
  });

  it("1월은 전년 12월부터 조회한다", async () => {
    mockResponses(
      { year: 2026, month: 1, totalExpense: 0, items: [] },
      { points: [], average: 0 },
    );
    expect(await getCategoryBreakdownWithDelta("family", 2026, 1)).toEqual({
      year: 2026,
      month: 1,
      totalExpense: 0,
      totalDelta: null,
      items: [],
    });
    expect(api).toHaveBeenCalledWith(
      "/families/family/dashboard/stats/category-breakdown?year=2026&month=1&compareWithPrev=true",
      expect.objectContaining({ schema: categoryBreakdownResponseSchema }),
    );
    expect(api).toHaveBeenCalledWith(
      "/families/family/dashboard/stats/monthly-trend?from=2025-12&to=2026-01",
      expect.objectContaining({ schema: monthlyTrendResponseSchema }),
    );
  });

  it("카테고리 500에도 성공한 추이의 총액 대비는 유지한다", async () => {
    mockResponses(new ServerApiError("failed", 500));
    expect(await getCategoryBreakdownWithDelta("family", 2026, 5)).toEqual({
      year: 2026,
      month: 5,
      totalExpense: 0,
      totalDelta: 20,
      items: [],
    });
  });

  it("추이 500에도 성공한 카테고리는 유지한다", async () => {
    mockResponses(breakdown, new ServerApiError("failed", 500));
    const result = await getCategoryBreakdownWithDelta("family", 2026, 5);
    expect(result.totalExpense).toBe(180);
    expect(result.items).toHaveLength(3);
    expect(result.items[0].deltaPercent).toBe(20);
    expect(result.totalDelta).toBeNull();
  });

  it("카테고리 응답 계약 위반은 빈 항목으로 바꾸고 추이의 총액 대비는 유지한다", async () => {
    mockResponses(
      new ResponseValidationError(
        "/families/:uuid/dashboard/stats/category-breakdown",
        [{ path: "items.0.deltaPercent", code: "invalid_type" }],
      ),
    );
    expect(await getCategoryBreakdownWithDelta("family", 2026, 5)).toEqual({
      year: 2026,
      month: 5,
      totalExpense: 0,
      totalDelta: 20,
      items: [],
    });
  });

  it("두 요청 500은 빈 결과로 바꾼다", async () => {
    mockResponses(
      new ServerApiError("failed", 500),
      new ServerApiError("failed", 500),
    );
    expect(await getCategoryBreakdownWithDelta("family", 2026, 5)).toEqual({
      year: 2026,
      month: 5,
      totalExpense: 0,
      totalDelta: null,
      items: [],
    });
  });

  it.each([true, false])(
    "500과 함께 발생한 401은 어느 요청이든 전파한다 (카테고리 401: %s)",
    async (categoryUnauthorized) => {
      const unauthorized = new ServerApiError("expired", 401);
      const failed = new ServerApiError("failed", 500);
      mockResponses(
        categoryUnauthorized ? unauthorized : failed,
        categoryUnauthorized ? failed : unauthorized,
      );
      await expect(
        getCategoryBreakdownWithDelta("family", 2026, 5),
      ).rejects.toBe(unauthorized);
    },
  );
});
