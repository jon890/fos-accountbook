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
jest.mock("@/app/(authenticated)/budget/_components/BudgetCumulativeLine", () => ({
  BudgetCumulativeLine: ({ dailyExpenses }: { dailyExpenses: unknown[] }) => (
    <div data-testid="daily-chart">일별 데이터 {dailyExpenses.length}개</div>
  ),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
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
  expect(screen.getByText(`2026년 ${month}월`)).toBeInTheDocument();
});

it("통계 성공 응답의 예산 연월을 유지한다", async () => {
  jest.mocked(getDashboardStatsAction).mockResolvedValue({ success: true, data: { year: 2026, month: 10, budget: 100, monthlyExpense: 10, monthlyIncome: 20, remainingBudget: 90, familyMembers: 1 } });
  render(await BudgetPage());
  expect(screen.getByText("2026년 10월")).toBeInTheDocument();
});

it.each([
  ["Asia/Seoul", 10, 1, 30, "₩3,000", "₩3,000"],
  ["America/New_York", 9, 30, 0, "₩100", "₩0"],
])("시간대 %s의 날짜로 실제 예산 화면의 남은 일수와 일 예산을 계산한다", async (timezone, month, day, remainingDays, dailyAverage, recommended) => {
  (auth as jest.Mock).mockResolvedValue({ user: { profile: { timezone } } });
  jest.mocked(getDashboardStatsAction).mockResolvedValue({
    success: true,
    data: {
      year: 2026,
      month,
      budget: 93000,
      monthlyExpense: 3000,
      monthlyIncome: 0,
      remainingBudget: 90000,
      familyMembers: 1,
    },
  });

  render(await BudgetPage());

  expect(screen.getByText(`2026년 ${month}월`)).toBeInTheDocument();
  expect(screen.getByText(`총 예산 ₩93,000 / ${remainingDays}일 남음`)).toBeInTheDocument();
  expect(screen.getByText("일 평균 지출").parentElement).toHaveTextContent(dailyAverage);
  expect(screen.getByText(`${day}일 기준`)).toBeInTheDocument();
  expect(screen.getByText("남은 일수").parentElement).toHaveTextContent(`${remainingDays}일`);
  expect(screen.getByText("권장 일 예산").parentElement).toHaveTextContent(recommended);
});

it("일별 통계의 일반 실패는 예산을 유지하면서 빈 차트로 표시한다", async () => {
  jest.mocked(getDashboardStatsAction).mockResolvedValue({
    success: true,
    data: {
      year: 2026,
      month: 10,
      budget: 100000,
      monthlyExpense: 10000,
      monthlyIncome: 20000,
      remainingBudget: 90000,
      familyMembers: 1,
    },
  });
  jest.mocked(getMonthlyDailyStatsAction).mockResolvedValue({
    success: false,
    error: { code: "C001", message: "일별 통계 조회 실패" },
  });

  render(await BudgetPage());

  expect(screen.getByText("2026년 10월")).toBeInTheDocument();
  expect(screen.getByTestId("daily-chart")).toHaveTextContent("일별 데이터 0개");
  expect(screen.getByText("총 예산 ₩100,000 / 30일 남음")).toBeInTheDocument();
});

it("일별 통계의 인증 만료는 빈 차트로 숨기지 않고 로그인으로 보낸다", async () => {
  jest.mocked(getMonthlyDailyStatsAction).mockResolvedValue({
    success: false,
    error: { code: "A002", message: "만료" },
  });

  await expect(BudgetPage()).rejects.toThrow("redirect:/auth/signin?error=auth");
});

it("통계 인증 만료는 로그인으로 보낸다", async () => {
  jest.mocked(getDashboardStatsAction).mockResolvedValue({ success: false, error: { code: "A002", message: "만료" } });
  await expect(BudgetPage()).rejects.toThrow("redirect:/auth/signin?error=auth");
});
