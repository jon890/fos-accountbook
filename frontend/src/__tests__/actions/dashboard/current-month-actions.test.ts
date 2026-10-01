/** @jest-environment node */
import { getDashboardStatsAction } from "@/actions/dashboard/get-dashboard-stats-action";
import { getMonthlyCategoryBreakdownAction } from "@/actions/dashboard/get-monthly-category-breakdown-action";
import { getCategoryBreakdownWithDeltaAction } from "@/actions/analytics/get-category-breakdown-with-delta-action";
import { getMonthlyTrendAction } from "@/actions/analytics/get-monthly-trend-action";
import { requireAuth, getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { getDashboardStats, getMonthlyCategoryBreakdown } from "@/services/dashboard/dashboard-service";
import { getCategoryBreakdownWithDelta, getMonthlyTrend } from "@/services/analytics/analytics-service";
import { ActionError } from "@/lib/errors";

jest.mock("@/lib/server/auth/auth-helpers", () => ({ requireAuth: jest.fn(), getSelectedFamilyUuid: jest.fn() }));
jest.mock("@/services/dashboard/dashboard-service", () => ({ getDashboardStats: jest.fn(), getMonthlyCategoryBreakdown: jest.fn() }));
jest.mock("@/services/analytics/analytics-service", () => ({ getCategoryBreakdownWithDelta: jest.fn(), getMonthlyTrend: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-09-30T16:00:00Z"));
  jest.mocked(getSelectedFamilyUuid).mockResolvedValue("family");
  (requireAuth as jest.Mock).mockResolvedValue({ user: { profile: { timezone: "Asia/Seoul" } } });
});

afterEach(() => jest.useRealTimers());

it.each(["Asia/Seoul", "America/New_York", "invalid", undefined])("통계 Action은 세션 시간대 %s를 Service에 전달한다", async (timezone) => {
  (requireAuth as jest.Mock).mockResolvedValue({ user: { profile: { timezone } } });
  await getDashboardStatsAction();
  expect(getDashboardStats).toHaveBeenCalledWith("family", timezone);
});

it.each([
  ["Asia/Seoul", 10],
  ["America/New_York", 9],
  ["invalid", 10],
  [undefined, 10],
])("기본 분석 연월은 시간대 %s의 현재 월이다", async (timezone, month) => {
  (requireAuth as jest.Mock).mockResolvedValue({ user: { profile: { timezone } } });
  await getMonthlyCategoryBreakdownAction();
  await getCategoryBreakdownWithDeltaAction();
  await getMonthlyTrendAction("m3");
  expect(getMonthlyCategoryBreakdown).toHaveBeenCalledWith("family", 2026, month);
  expect(getCategoryBreakdownWithDelta).toHaveBeenCalledWith("family", 2026, month);
  expect(getMonthlyTrend).toHaveBeenCalledWith("family", "m3", 2026, month);
});

it("명시한 연월은 시간대와 관계없이 유지한다", async () => {
  await getMonthlyCategoryBreakdownAction(2024, 2);
  await getCategoryBreakdownWithDeltaAction(2024, 2);
  await getMonthlyTrendAction("y1", 2024, 2);
  expect(getMonthlyCategoryBreakdown).toHaveBeenCalledWith("family", 2024, 2);
  expect(getCategoryBreakdownWithDelta).toHaveBeenCalledWith("family", 2024, 2);
  expect(getMonthlyTrend).toHaveBeenCalledWith("family", "y1", 2024, 2);
});

it("잘못된 명시 월은 기본 월로 숨기지 않고 검증 실패를 반환한다", async () => {
  expect((await getMonthlyCategoryBreakdownAction(2026, 13)).success).toBe(false);
  expect((await getCategoryBreakdownWithDeltaAction(2026, 0)).success).toBe(false);
  expect((await getMonthlyTrendAction("m1", 2026, 13)).success).toBe(false);
  expect(getMonthlyCategoryBreakdown).not.toHaveBeenCalled();
  expect(getCategoryBreakdownWithDelta).not.toHaveBeenCalled();
  expect(getMonthlyTrend).not.toHaveBeenCalled();
});

it("인증 실패에서는 서비스를 호출하지 않는다", async () => {
  jest.mocked(requireAuth).mockRejectedValue(ActionError.unauthorized());
  const results = await Promise.all([
    getDashboardStatsAction(),
    getMonthlyCategoryBreakdownAction(),
    getCategoryBreakdownWithDeltaAction(),
    getMonthlyTrendAction("m1"),
  ]);
  expect(results.every((result) => !result.success)).toBe(true);
  expect(getDashboardStats).not.toHaveBeenCalled();
  expect(getMonthlyCategoryBreakdown).not.toHaveBeenCalled();
  expect(getCategoryBreakdownWithDelta).not.toHaveBeenCalled();
  expect(getMonthlyTrend).not.toHaveBeenCalled();
});
