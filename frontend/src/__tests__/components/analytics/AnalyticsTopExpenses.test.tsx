import { AnalyticsTopExpenses } from "@/app/(authenticated)/analytics/_components/AnalyticsTopExpenses";
import { cleanup, render, screen } from "@testing-library/react";

const categories = [{
  uuid: "food",
  familyUuid: "family-1",
  type: "EXPENSE" as const,
  name: "식비",
  icon: "🍚",
  color: "#f00",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}];

const expenses = [{
  uuid: "expense-1",
  userUuid: "user-1",
  familyUuid: "family-1",
  categoryUuid: "food",
  category: null,
  amount: 30000,
  description: "점심",
  date: "2026-10-01T12:00:00.000Z",
  excludeFromBudget: false,
  createdAt: "2026-10-01T12:00:00.000Z",
  updatedAt: "2026-10-01T12:00:00.000Z",
}];

describe("AnalyticsTopExpenses", () => {
  afterEach(cleanup);

  it("categoryUuid에 맞는 카테고리 이름과 아이콘을 표시한다", () => {
    render(<AnalyticsTopExpenses expenses={expenses} categories={categories} totalElements={1} />);

    expect(screen.getByText("🍚")).toBeInTheDocument();
    expect(screen.getByText("식비 · 2026-10-01")).toBeInTheDocument();
  });

  it("1000건을 초과하면 최근 목록에서 고른 사실을 안내한다", () => {
    render(<AnalyticsTopExpenses expenses={expenses} categories={categories} totalElements={1001} />);

    expect(screen.getByText("최근 1000건 안에서 골랐어요")).toHaveClass("text-xs", "text-fg-muted");
  });

  it("정확히 1000건이면 최근 목록 안내를 표시하지 않는다", () => {
    const thousandExpenses = Array.from({ length: 1000 }, (_, index) => ({
      ...expenses[0],
      uuid: `expense-${index}`,
    }));

    render(<AnalyticsTopExpenses expenses={thousandExpenses} categories={categories} totalElements={1000} />);

    expect(screen.queryByText("최근 1000건 안에서 골랐어요")).not.toBeInTheDocument();
  });

  it("삭제된 카테고리는 기본 이름과 아이콘을 표시한다", () => {
    render(<AnalyticsTopExpenses expenses={[{ ...expenses[0], categoryUuid: "deleted", description: null }]} categories={categories} totalElements={1} />);

    expect(screen.getByText("💸")).toBeInTheDocument();
    expect(screen.getByText("기타")).toBeInTheDocument();
  });
});
