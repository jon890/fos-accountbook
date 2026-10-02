/** @jest-environment node */
jest.mock("@/lib/server/api/client", () => ({ serverApiGet: jest.fn() }));
jest.mock("@/lib/server/cache", () => ({
  getCachedDashboardStats: jest.fn(),
  getCachedFamilyCategories: jest.fn(),
}));

import { serverApiGet } from "@/lib/server/api/client";
import { categoryBreakdownResponseSchema } from "@/lib/schemas/responses/dashboard";
import {
  ResponseValidationError,
  ServerApiError,
} from "@/lib/server/api/types";
import { getMonthlyCategoryBreakdown } from "@/services/dashboard/dashboard-service";

const api = jest.mocked(serverApiGet);

beforeEach(() => api.mockReset());

describe("getMonthlyCategoryBreakdown", () => {
  it("집계 경로와 삭제된 카테고리, 비율 반올림을 확인한다", async () => {
    api.mockResolvedValue({
      year: 2026,
      month: 3,
      totalExpense: 300,
      items: [
        {
          categoryUuid: "deleted",
          name: null,
          icon: null,
          color: null,
          totalAmount: 100,
          percentage: 33.33,
        },
        {
          categoryUuid: "food",
          name: "식비",
          icon: "🍔",
          color: "teal",
          totalAmount: 200,
          percentage: 66.67,
        },
      ],
    });
    expect(await getMonthlyCategoryBreakdown("family", 2026, 3)).toEqual({
      year: 2026,
      month: 3,
      totalExpense: 300,
      items: [
        {
          categoryUuid: "deleted",
          name: "Unknown",
          icon: "💰",
          color: undefined,
          totalAmount: 100,
          percentage: 33,
        },
        {
          categoryUuid: "food",
          name: "식비",
          icon: "🍔",
          color: "teal",
          totalAmount: 200,
          percentage: 67,
        },
      ],
    });
    expect(api).toHaveBeenCalledWith(
      "/families/family/dashboard/stats/category-breakdown?year=2026&month=3&compareWithPrev=false",
      expect.objectContaining({ schema: categoryBreakdownResponseSchema }),
    );
  });

  it("빈 집계를 유지한다", async () => {
    api.mockResolvedValue({ year: 2026, month: 3, totalExpense: 0, items: [] });
    expect(await getMonthlyCategoryBreakdown("family", 2026, 3)).toEqual({
      year: 2026,
      month: 3,
      totalExpense: 0,
      items: [],
    });
  });

  it.each([
    new ServerApiError("failed", 500),
    new Error("network"),
    new ResponseValidationError(
      "/families/:uuid/dashboard/stats/category-breakdown",
      [{ path: "items.0.totalAmount", code: "invalid_type" }],
    ),
  ])(
    "일반 실패와 응답 계약 위반은 빈 집계로 바꾼다: %s",
    async (error) => {
      api.mockRejectedValue(error);
      expect(await getMonthlyCategoryBreakdown("family", 2026, 3)).toEqual({
        year: 2026,
        month: 3,
        totalExpense: 0,
        items: [],
      });
    },
  );
  it("401은 전파한다", async () => {
    const error = new ServerApiError("expired", 401);
    api.mockRejectedValue(error);
    await expect(getMonthlyCategoryBreakdown("family", 2026, 3)).rejects.toBe(
      error,
    );
  });
});
