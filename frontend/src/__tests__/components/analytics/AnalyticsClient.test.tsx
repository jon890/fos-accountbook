jest.mock("@/lib/client/navigation", () => ({
  useNavigationPending: jest.fn(),
}));
jest.mock("@/actions/dashboard/get-dashboard-stats-action", () => ({ getDashboardStatsAction: jest.fn() }));
jest.mock("@/actions/dashboard/get-monthly-daily-stats-action", () => ({ getMonthlyDailyStatsAction: jest.fn() }));
jest.mock("@/actions/expense/get-expenses-action", () => ({ getExpensesAction: jest.fn() }));
jest.mock("@/app/(authenticated)/analytics/_components/AnalyticsPeriodToggle", () => ({ AnalyticsPeriodToggle: () => <div /> }));
jest.mock("@/app/(authenticated)/analytics/_components/AnalyticsCategoryDonut", () => ({ AnalyticsCategoryDonut: () => <div /> }));
jest.mock("@/app/(authenticated)/analytics/_components/MonthlyTrendBar", () => ({ MonthlyTrendBar: () => <div /> }));
jest.mock("@/app/(authenticated)/analytics/_components/CategoryDetailList", () => ({ CategoryDetailList: () => <div /> }));

import { AnalyticsClient } from "@/app/(authenticated)/analytics/_components/AnalyticsClient";
import { getDashboardStatsAction } from "@/actions/dashboard/get-dashboard-stats-action";
import { getMonthlyDailyStatsAction } from "@/actions/dashboard/get-monthly-daily-stats-action";
import { getExpensesAction } from "@/actions/expense/get-expenses-action";
import { useNavigationPending } from "@/lib/client/navigation";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const defaultProps = {
  initialYear: 2026,
  initialMonth: 9,
  initialStats: null,
  initialDailyStats: [],
  initialExpenses: [],
  initialTotalElements: 0,
  categories: [],
  familyUuid: "family-1",
  period: "m1" as const,
  initialBreakdown: null,
  initialTrend: null,
};

describe("AnalyticsClient", () => {
  beforeEach(() => {
    jest.mocked(useNavigationPending).mockReturnValue(false);
  });

  it("기간 전환 중 본문을 흐리게 하고 aria-busy를 표시한다", () => {
    jest.mocked(useNavigationPending).mockReturnValue(true);
    const { container } = render(<AnalyticsClient {...defaultProps} />);

    expect(container.firstChild).toHaveAttribute("aria-busy", "true");
    expect(container.firstChild).toHaveClass("opacity-60", "pointer-events-none");
  });

  it("월 이동 뒤 받은 전체 건수로 최근 1000건 안내를 갱신한다", async () => {
    jest.mocked(getMonthlyDailyStatsAction).mockResolvedValue({ success: true, data: [] });
    jest.mocked(getDashboardStatsAction).mockResolvedValue({
      success: true,
      data: {
        monthlyExpense: 0,
        monthlyIncome: 0,
        remainingBudget: 0,
        budget: 0,
        familyMembers: 1,
        year: 2026,
        month: 10,
      },
    });
    jest.mocked(getExpensesAction).mockResolvedValue({
      success: true,
      data: {
        items: [{
          uuid: "expense-1",
          userUuid: "user-1",
          familyUuid: "family-1",
          categoryUuid: "food",
          category: null,
          amount: 30000,
          description: "점심",
          date: "2026-08-10T12:00:00.000Z",
          excludeFromBudget: false,
          createdAt: "2026-08-10T12:00:00.000Z",
          updatedAt: "2026-08-10T12:00:00.000Z",
        }],
        totalElements: 1001,
        totalPages: 2,
        currentPage: 0,
      },
    });

    const thousandInitialExpenses = Array.from({ length: 1000 }, (_, index) => ({
      uuid: `initial-expense-${index}`,
      userUuid: "user-1",
      familyUuid: "family-1",
      categoryUuid: "food",
      category: null,
      amount: 10000,
      description: "초기 지출",
      date: "2026-09-10T12:00:00.000Z",
      excludeFromBudget: false,
      createdAt: "2026-09-10T12:00:00.000Z",
      updatedAt: "2026-09-10T12:00:00.000Z",
    }));

    render(<AnalyticsClient {...defaultProps} initialExpenses={thousandInitialExpenses} initialTotalElements={1000} />);

    expect(screen.queryByText("최근 1000건 안에서 골랐어요")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "이전 달" }));

    await waitFor(() => {
      expect(screen.getByText("최근 1000건 안에서 골랐어요")).toBeInTheDocument();
    });
  });
});
