import { createElement, type ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import dynamic from "next/dynamic";
import { CategoryDistribution } from "@/components/dashboard/CategoryDistribution";
import { AnalyticsCategoryDonut } from "@/app/(authenticated)/analytics/_components/AnalyticsCategoryDonut";
import { BudgetCumulativeLine } from "@/app/(authenticated)/budget/_components/BudgetCumulativeLine";
import type { MonthlyCategoryBreakdown } from "@/types/dashboard";
import type { CategoryBreakdownWithDelta } from "@/types/analytics";

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: jest.fn(() => {
    return jest.fn(() => createElement("div", { "data-testid": "lazy-chart" }));
  }),
}));

interface LoadingOptions {
  ssr: boolean;
  loading: () => ReactElement;
}

const mockDynamic = jest.mocked(dynamic);
const dashboardChart = mockDynamic.mock.results[0].value as jest.Mock;
const analyticsChart = mockDynamic.mock.results[1].value as jest.Mock;
const budgetChart = mockDynamic.mock.results[2].value as jest.Mock;

const breakdown: MonthlyCategoryBreakdown = {
  year: 2026,
  month: 9,
  totalExpense: 30000,
  items: [
    {
      categoryUuid: "category-food",
      name: "식비",
      icon: "🍽️",
      totalAmount: 20000,
      percentage: 67,
    },
    {
      categoryUuid: "category-transport",
      name: "교통",
      icon: "🚗",
      totalAmount: 10000,
      percentage: 33,
    },
  ],
};

const analyticsBreakdown: CategoryBreakdownWithDelta = {
  ...breakdown,
  totalDelta: 10,
  items: breakdown.items.map((item) => ({ ...item, deltaPercent: null, isNew: false })),
};

describe("차트 지연 로드", () => {
  beforeEach(() => {
    dashboardChart.mockClear();
    analyticsChart.mockClear();
    budgetChart.mockClear();
  });

  it.each([
    {
      index: 0,
      name: "대시보드 분포",
      mobile: "h-[120px]",
      desktop: "md:h-[180px]",
    },
    {
      index: 1,
      name: "분석 분포",
      mobile: "h-[172px]",
      desktop: "md:h-[160px]",
    },
    {
      index: 2,
      name: "예산 누적",
      mobile: "h-48",
      desktop: "md:h-64",
    },
  ])(
    "$name 차트는 SSR을 끄고 기존 높이의 로딩 화면을 제공한다",
    ({ index, mobile, desktop }) => {
      const options = mockDynamic.mock.calls[index][1] as LoadingOptions;
      const Loading = options.loading;
      const { container } = render(<Loading />);

      expect(options.ssr).toBe(false);
      expect(container.firstElementChild).toHaveClass(mobile, desktop);
      expect(container.querySelector(".ab-skel")).toHaveClass("[--skel-h:100%]");
    },
  );

  it("대시보드 분포는 breakdown과 합계, 범례를 유지한다", () => {
    render(<CategoryDistribution breakdown={breakdown} />);

    expect(dashboardChart.mock.calls[0][0]).toEqual({ breakdown });
    expect(screen.getByText("카테고리 분포")).toBeInTheDocument();
    expect(screen.getByText("총 지출")).toBeInTheDocument();
    expect(screen.getByText("식비")).toBeInTheDocument();
    expect(screen.getByText("교통")).toBeInTheDocument();
  });

  it("분석 분포는 전체 breakdown을 차트로 전달하고 topN만큼 범례를 표시한다", () => {
    render(<AnalyticsCategoryDonut breakdown={analyticsBreakdown} topN={1} />);

    expect(analyticsChart.mock.calls[0][0]).toEqual({
      breakdown: analyticsBreakdown,
    });
    expect(screen.getByText("식비")).toBeInTheDocument();
    expect(screen.queryByText("교통")).not.toBeInTheDocument();
    expect(screen.getByText("9월 지출")).toBeInTheDocument();
    expect(screen.getByText("↑ 10%")).toBeInTheDocument();
  });

  it("예산 누적은 일 지출과 월 일수, 예산을 차트 데이터에 반영한다", () => {
    render(
      <BudgetCumulativeLine
        dailyExpenses={[{ date: "2026-09-02T12:00:00", income: 0, expense: 15000 }]}
        budget={10000}
        daysInMonth={3}
      />,
    );

    expect(budgetChart.mock.calls[0][0]).toEqual({
      budget: 10000,
      chartData: [
        { day: 1, cumulative: 0, dailyExpense: 0, exceeded: false },
        { day: 2, cumulative: 15000, dailyExpense: 15000, exceeded: true },
        { day: 3, cumulative: 15000, dailyExpense: 0, exceeded: true },
      ],
    });
    expect(screen.getByText("이번 달 누적 지출")).toBeInTheDocument();
    expect(screen.getByText("누적")).toBeInTheDocument();
    expect(screen.getByText("예산")).toBeInTheDocument();
    expect(screen.getByText(/\(100%\)/)).toBeInTheDocument();
  });

  it("빈 분포는 안내 문구를 표시하고 차트를 렌더링하지 않는다", () => {
    const emptyBreakdown = { ...breakdown, totalExpense: 0, items: [] };
    const emptyAnalyticsBreakdown = {
      ...analyticsBreakdown,
      totalExpense: 0,
      items: [],
    };
    render(<CategoryDistribution breakdown={emptyBreakdown} />);
    render(<AnalyticsCategoryDonut breakdown={emptyAnalyticsBreakdown} />);

    expect(screen.getByText("이번 달 지출이 아직 없어요")).toBeInTheDocument();
    expect(screen.getByText("이번 달 지출 없음")).toBeInTheDocument();
    expect(screen.queryByTestId("lazy-chart")).not.toBeInTheDocument();
  });

  it("예산과 지출이 0이어도 한 날짜와 0%를 표시한다", () => {
    render(<BudgetCumulativeLine dailyExpenses={[]} budget={0} daysInMonth={1} />);

    expect(budgetChart.mock.calls[0][0]).toEqual({
      budget: 0,
      chartData: [{ day: 1, cumulative: 0, dailyExpense: 0, exceeded: true }],
    });
    expect(screen.getByText(/\(0%\)/)).toBeInTheDocument();
  });
});
