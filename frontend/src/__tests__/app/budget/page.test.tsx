import { render, screen } from "@testing-library/react";
import BudgetPage from "@/app/(authenticated)/budget/page";
import { auth } from "@/lib/server/auth";
import { getDashboardStatsAction } from "@/actions/dashboard/get-dashboard-stats-action";
import { getMonthlyCategoryBreakdownAction } from "@/actions/dashboard/get-monthly-category-breakdown-action";
import { getMonthlyDailyStatsAction } from "@/actions/dashboard/get-monthly-daily-stats-action";

jest.mock("@/lib/server/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/server/auth/auth-helpers", () => ({ getSelectedFamilyUuid: jest.fn().mockResolvedValue("family") }));
jest.mock("@/actions/dashboard/get-dashboard-stats-action", () => ({ getDashboardStatsAction: jest.fn() }));
jest.mock("@/actions/dashboard/get-monthly-category-breakdown-action", () => ({ getMonthlyCategoryBreakdownAction: jest.fn() }));
jest.mock("@/actions/dashboard/get-monthly-daily-stats-action", () => ({ getMonthlyDailyStatsAction: jest.fn() }));
jest.mock("@/app/(authenticated)/budget/_components/BudgetClient", () => ({
  BudgetClient: ({ year, month }: { year: number; month: number }) => (
    <div>예산:{year}-{month}</div>
  ),
}));
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-09-30T16:00:00Z"));
  (auth as jest.Mock).mockResolvedValue({ user: { profile: { timezone: "Asia/Seoul" } } });
  jest.mocked(getDashboardStatsAction).mockResolvedValue({ success: false, error: { code: "C001", message: "조회 실패" } });
  jest.mocked(getMonthlyCategoryBreakdownAction).mockResolvedValue({ success: false, error: { code: "C001", message: "조회 실패" } });
  jest.mocked(getMonthlyDailyStatsAction).mockResolvedValue({ success: true, data: [] });
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it.each([
  ["Asia/Seoul", 10],
  ["America/New_York", 9],
  ["invalid", 10],
  [undefined, 10],
])("시간대 %s의 현재 월로 예산을 조회하고 실패 기본값에도 사용한다", async (timezone, month) => {
  (auth as jest.Mock).mockResolvedValue({ user: { profile: { timezone } } });
  render(await BudgetPage());
  expect(getMonthlyDailyStatsAction).toHaveBeenCalledWith(2026, month);
  expect(screen.getByText(`예산:2026-${month}`)).toBeInTheDocument();
});

it("통계 성공 응답의 예산 연월을 유지한다", async () => {
  jest.mocked(getDashboardStatsAction).mockResolvedValue({ success: true, data: { year: 2026, month: 10, budget: 100, monthlyExpense: 10, monthlyIncome: 20, remainingBudget: 90, familyMembers: 1 } });
  render(await BudgetPage());
  expect(screen.getByText("예산:2026-10")).toBeInTheDocument();
});

it("통계 인증 만료는 로그인으로 보낸다", async () => {
  jest.mocked(getDashboardStatsAction).mockResolvedValue({ success: false, error: { code: "A002", message: "만료" } });
  await expect(BudgetPage()).rejects.toThrow("redirect:/auth/signin?error=auth");
});
