/**
 * analytics-service 단위 테스트
 * @jest-environment node
 */

jest.mock("@/lib/env/server.env", () => ({
  serverEnv: {
    BACKEND_API_URL: "http://localhost:8080",
  },
}));
jest.mock("@/lib/server/auth/auth", () => ({
  handlers: {},
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock("@/lib/server/api/client");
jest.mock("@/lib/server/cache");
jest.mock("@/services/dashboard/dashboard-service");

import {
  getCategoryBreakdownWithDelta,
  getMonthlyTrend,
} from "@/services/analytics/analytics-service";
import { getMonthlyCategoryBreakdown } from "@/services/dashboard/dashboard-service";
import type { MonthlyCategoryBreakdown } from "@/types/dashboard";

const mockGetBreakdown = getMonthlyCategoryBreakdown as jest.MockedFunction<
  typeof getMonthlyCategoryBreakdown
>;

function makeBreakdown(
  year: number,
  month: number,
  items: Array<{ uuid: string; name: string; amount: number }>,
): MonthlyCategoryBreakdown {
  const totalExpense = items.reduce((s, i) => s + i.amount, 0);
  return {
    year,
    month,
    totalExpense,
    items: items.map((i) => ({
      categoryUuid: i.uuid,
      name: i.name,
      icon: "📦",
      totalAmount: i.amount,
      percentage: totalExpense > 0 ? Math.round((i.amount / totalExpense) * 100) : 0,
    })),
  };
}

describe("getMonthlyTrend", () => {
  beforeEach(() => {
    mockGetBreakdown.mockReset();
  });

  it("returns 3 points for period=m3 ascending by time", async () => {
    mockGetBreakdown.mockImplementation(async (_uuid, year, month) =>
      makeBreakdown(year, month, [{ uuid: "c1", name: "식비", amount: 100000 }]),
    );

    const result = await getMonthlyTrend("fam-1", "m3", 2026, 5);

    expect(result.period).toBe("m3");
    expect(result.points).toHaveLength(3);
    expect(result.points[0]).toMatchObject({ year: 2026, month: 3 });
    expect(result.points[2]).toMatchObject({ year: 2026, month: 5 });
    expect(result.average).toBe(100000);
  });

  it("returns 12 points for period=y1, crossing year boundary", async () => {
    mockGetBreakdown.mockImplementation(async (_uuid, year, month) =>
      makeBreakdown(year, month, [{ uuid: "c1", name: "식비", amount: 50000 }]),
    );

    const result = await getMonthlyTrend("fam-1", "y1", 2026, 2);

    expect(result.points).toHaveLength(12);
    expect(result.points[0]).toMatchObject({ year: 2025, month: 3 });
    expect(result.points[11]).toMatchObject({ year: 2026, month: 2 });
  });

  it("averages 0 when all months empty", async () => {
    mockGetBreakdown.mockImplementation(async (_uuid, year, month) =>
      makeBreakdown(year, month, []),
    );

    const result = await getMonthlyTrend("fam-1", "m1", 2026, 5);
    expect(result.points).toHaveLength(1);
    expect(result.average).toBe(0);
  });
});

describe("getCategoryBreakdownWithDelta", () => {
  beforeEach(() => {
    mockGetBreakdown.mockReset();
  });

  it("computes deltaPercent correctly for both current/previous categories", async () => {
    mockGetBreakdown.mockImplementation(async (_uuid, year, month) => {
      if (year === 2026 && month === 5) {
        return makeBreakdown(2026, 5, [
          { uuid: "c1", name: "식비", amount: 120000 },
          { uuid: "c2", name: "교통", amount: 60000 },
        ]);
      }
      return makeBreakdown(2026, 4, [
        { uuid: "c1", name: "식비", amount: 100000 },
        { uuid: "c2", name: "교통", amount: 80000 },
      ]);
    });

    const result = await getCategoryBreakdownWithDelta("fam-1", 2026, 5);

    expect(result.year).toBe(2026);
    expect(result.month).toBe(5);
    expect(result.totalExpense).toBe(180000);
    expect(result.totalDelta).toBe(0);
    const food = result.items.find((i) => i.categoryUuid === "c1");
    expect(food?.deltaPercent).toBe(20);
    const transit = result.items.find((i) => i.categoryUuid === "c2");
    expect(transit?.deltaPercent).toBe(-25);
  });

  it("returns deltaPercent=null when previous month has 0 for category", async () => {
    mockGetBreakdown.mockImplementation(async (_uuid, year, month) => {
      if (year === 2026 && month === 5) {
        return makeBreakdown(2026, 5, [{ uuid: "c1", name: "식비", amount: 50000 }]);
      }
      return makeBreakdown(2026, 4, []);
    });

    const result = await getCategoryBreakdownWithDelta("fam-1", 2026, 5);
    expect(result.items[0].deltaPercent).toBeNull();
    expect(result.totalDelta).toBeNull();
  });

  it("crosses year boundary (jan → dec previous year)", async () => {
    mockGetBreakdown.mockImplementation(async (_uuid, year, month) =>
      makeBreakdown(year, month, [{ uuid: "c1", name: "식비", amount: 10000 }]),
    );

    const result = await getCategoryBreakdownWithDelta("fam-1", 2026, 1);

    expect(mockGetBreakdown).toHaveBeenCalledWith("fam-1", 2026, 1);
    expect(mockGetBreakdown).toHaveBeenCalledWith("fam-1", 2025, 12);
    expect(result.year).toBe(2026);
    expect(result.month).toBe(1);
  });
});
