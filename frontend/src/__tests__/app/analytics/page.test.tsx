import { render, screen } from "@testing-library/react";
import AnalyticsPage from "@/app/(authenticated)/analytics/page";
import { auth } from "@/lib/server/auth";
import { getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { getDashboardStatsAction } from "@/actions/dashboard/get-dashboard-stats-action";
import { getMonthlyDailyStatsAction } from "@/actions/dashboard/get-monthly-daily-stats-action";
import { getExpensesAction } from "@/actions/expense/get-expenses-action";
import { getCategoryBreakdownWithDeltaAction } from "@/actions/analytics/get-category-breakdown-with-delta-action";
import { getMonthlyTrendAction } from "@/actions/analytics/get-monthly-trend-action";
import { getRecurringExpensesTotalAction } from "@/actions/recurring-expense";
import { redirect } from "next/navigation";

jest.mock("@/lib/server/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/server/auth/auth-helpers", () => ({ getSelectedFamilyUuid: jest.fn() }));
jest.mock("@/actions/dashboard/get-dashboard-stats-action", () => ({ getDashboardStatsAction: jest.fn() }));
jest.mock("@/actions/dashboard/get-monthly-daily-stats-action", () => ({ getMonthlyDailyStatsAction: jest.fn() }));
jest.mock("@/actions/expense/get-expenses-action", () => ({ getExpensesAction: jest.fn() }));
jest.mock("@/actions/analytics/get-category-breakdown-with-delta-action", () => ({ getCategoryBreakdownWithDeltaAction: jest.fn() }));
jest.mock("@/actions/analytics/get-monthly-trend-action", () => ({ getMonthlyTrendAction: jest.fn() }));
jest.mock("@/actions/recurring-expense", () => ({ getRecurringExpensesTotalAction: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));
jest.mock("@/app/(authenticated)/analytics/_components/AnalyticsClient", () => ({
  AnalyticsClient: ({
    initialYear,
    initialMonth,
  }: {
    initialYear: number;
    initialMonth: number;
  }) => (
    <div>분석:{initialYear}-{initialMonth}</div>
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-09-30T16:00:00Z"));
  (auth as jest.Mock).mockResolvedValue({ user: { profile: { timezone: "Asia/Seoul" } } });
  jest.mocked(getSelectedFamilyUuid).mockResolvedValue("family");
  jest.mocked(getDashboardStatsAction).mockResolvedValue({ success: true, data: {
    monthlyExpense: 10000,
    monthlyIncome: 30000,
    remainingBudget: 90000,
    budget: 100000,
    familyMembers: 2,
    year: 2026,
    month: 10,
  } });
  jest.mocked(getMonthlyDailyStatsAction).mockResolvedValue({ success: true, data: [] });
  jest.mocked(getExpensesAction).mockResolvedValue({ success: true, data: { items: [], totalElements: 0, totalPages: 0, currentPage: 0 } });
  jest.mocked(getCategoryBreakdownWithDeltaAction).mockResolvedValue({ success: true, data: { year: 2026, month: 10, totalExpense: 10000, totalDelta: null, items: [] } });
  jest.mocked(getMonthlyTrendAction).mockResolvedValue({ success: true, data: { period: "m1", points: [], average: 0 } });
  jest.mocked(getRecurringExpensesTotalAction).mockResolvedValue({ success: true, data: 17000 });
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it("기간 차트 위에 예산 링크, 수입과 지출, 고정비 링크를 표시한다", async () => {
  render(await AnalyticsPage({ searchParams: Promise.resolve({}) }));
  expect(screen.getByRole("link", { name: "예산 보기" })).toHaveAttribute("href", "/budget");
  expect(screen.getByText("이번 달 수입")).toBeInTheDocument();
  expect(screen.getByText("이번 달 지출")).toBeInTheDocument();
  expect(screen.getByText("₩30,000")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /이달 고정비/ })).toHaveAttribute("href", "/transactions?tab=recurring");
  expect(screen.getByText("₩17,000")).toBeInTheDocument();
  expect(screen.getByText("30일 남음")).toBeInTheDocument();
});

it.each([
  ["Asia/Seoul", 10, "2026-10-01", "2026-10-31"],
  ["America/New_York", 9, "2026-09-01", "2026-09-30"],
  ["invalid", 10, "2026-10-01", "2026-10-31"],
  [undefined, 10, "2026-10-01", "2026-10-31"],
])("시간대 %s로 분석 최초 조회 연월과 월 범위를 결정한다", async (timezone, month, startDate, endDate) => {
  (auth as jest.Mock).mockResolvedValue({ user: { profile: { timezone } } });
  render(await AnalyticsPage({ searchParams: Promise.resolve({ period: "m3" }) }));
  expect(getMonthlyDailyStatsAction).toHaveBeenCalledWith(2026, month);
  expect(getExpensesAction).toHaveBeenCalledWith({ familyUuid: "family", startDate, endDate, limit: 1000 });
  expect(getCategoryBreakdownWithDeltaAction).toHaveBeenCalledWith(2026, month);
  expect(getMonthlyTrendAction).toHaveBeenCalledWith("m3", 2026, month);
  expect(screen.getByText(`분석:2026-${month}`)).toBeInTheDocument();
});

it("잘못된 기간은 기본 기간으로 조회한다", async () => {
  render(await AnalyticsPage({ searchParams: Promise.resolve({ period: "invalid" }) }));
  expect(getMonthlyTrendAction).toHaveBeenCalledWith("m1", 2026, 10);
});

it.each([
  getDashboardStatsAction,
  getMonthlyDailyStatsAction,
  getExpensesAction,
  getCategoryBreakdownWithDeltaAction,
  getMonthlyTrendAction,
  getRecurringExpensesTotalAction,
])("각 조회의 일반 오류는 기본값으로 숨기지 않고 오류 화면으로 전달한다", async (action) => {
  (action as jest.Mock).mockResolvedValue({ success: false, error: { code: "C001", message: "조회 실패" } });
  await expect(AnalyticsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("조회 실패");
  expect(redirect).not.toHaveBeenCalled();
});

it("통계와 고정비가 0이어도 성공 데이터로 표시한다", async () => {
  jest.mocked(getDashboardStatsAction).mockResolvedValue({ success: true, data: {
    monthlyExpense: 0,
    monthlyIncome: 0,
    remainingBudget: 0,
    budget: 0,
    familyMembers: 1,
    year: 2026,
    month: 10,
  } });
  jest.mocked(getRecurringExpensesTotalAction).mockResolvedValue({ success: true, data: 0 });
  render(await AnalyticsPage({ searchParams: Promise.resolve({}) }));
  expect(screen.getByText("예산 미설정")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /이달 고정비/ })).toHaveTextContent("₩0");
});

it.each([
  getDashboardStatsAction,
  getMonthlyDailyStatsAction,
  getExpensesAction,
  getCategoryBreakdownWithDeltaAction,
  getMonthlyTrendAction,
  getRecurringExpensesTotalAction,
])("어느 조회에서든 인증 만료가 오면 로그인으로 보낸다", async (action) => {
  (action as jest.Mock).mockResolvedValue({ success: false, error: { code: "A002", message: "세션 만료" } });
  await expect(AnalyticsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/auth/signin?error=auth");
  expect(redirect).toHaveBeenCalledWith(`/auth/signin?error=auth&message=${encodeURIComponent("세션 만료")}`);
});

it("로그인하지 않았으면 조회 전에 로그인으로 보낸다", async () => {
  (auth as jest.Mock).mockResolvedValue(null);
  await expect(AnalyticsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/auth/signin");
  expect(getDashboardStatsAction).not.toHaveBeenCalled();
});
