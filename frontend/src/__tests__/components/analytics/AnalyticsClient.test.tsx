jest.mock("@/lib/client/navigation", () => ({ useNavigationPending: jest.fn() }));
jest.mock("@/actions/dashboard/get-dashboard-stats-action", () => ({ getDashboardStatsAction: jest.fn() }));
jest.mock("@/actions/dashboard/get-monthly-daily-stats-action", () => ({ getMonthlyDailyStatsAction: jest.fn() }));
jest.mock("@/actions/expense/get-expenses-action", () => ({ getExpensesAction: jest.fn() }));
jest.mock("@/app/(authenticated)/analytics/_components/AnalyticsPeriodToggle", () => ({ AnalyticsPeriodToggle: () => <div /> }));
jest.mock("@/app/(authenticated)/analytics/_components/AnalyticsCategoryDonut", () => ({ AnalyticsCategoryDonut: () => <div /> }));
jest.mock("@/app/(authenticated)/analytics/_components/MonthlyTrendBar", () => ({ MonthlyTrendBar: () => <div /> }));
jest.mock("@/app/(authenticated)/analytics/_components/CategoryDetailList", () => ({ CategoryDetailList: () => <div /> }));

import { AnalyticsClient } from "@/app/(authenticated)/analytics/_components/AnalyticsClient";
import { useNavigationPending } from "@/lib/client/navigation";
import { render } from "@testing-library/react";

describe("AnalyticsClient", () => {
  it("기간 전환 중 본문을 흐리게 하고 aria-busy를 표시한다", () => {
    jest.mocked(useNavigationPending).mockReturnValue(true);
    const { container } = render(<AnalyticsClient initialYear={2026} initialMonth={9} initialStats={null} initialDailyStats={[]} initialExpenses={[]} familyUuid="family-1" period="m1" initialBreakdown={null} initialTrend={null} />);

    expect(container.firstChild).toHaveAttribute("aria-busy", "true");
    expect(container.firstChild).toHaveClass("opacity-60", "pointer-events-none");
  });
});
