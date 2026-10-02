import { render, screen, within } from "@testing-library/react";
import { BudgetSummaryCard } from "@/components/calendar/BudgetSummaryCard";
import type { BudgetSummary } from "@/types/budget-item";

const summary: BudgetSummary = {
  year: 2026,
  month: 10,
  living: { spent: 620000, limit: 1000000 },
  items: [
    { budgetItemUuid: "item-1", name: "남편 용돈", limit: 400000, spent: 150000 },
    { budgetItemUuid: "item-2", name: "아내 용돈", limit: 400000, spent: 410000 },
  ],
};

describe("BudgetSummaryCard", () => {
  it("생활비를 첫 줄에 두고 항목을 순서대로 보여 퍼센트를 계산한다", () => {
    render(<BudgetSummaryCard summary={summary} />);

    const names = screen.getAllByText(/^(생활비|남편 용돈|아내 용돈)$/).map((el) => el.textContent);
    expect(names).toEqual(["생활비", "남편 용돈", "아내 용돈"]);
    expect(screen.getByText("62%")).toBeInTheDocument();
    expect(screen.getByText("38%")).toBeInTheDocument();
    expect(screen.getByText("₩620,000")).toBeInTheDocument();
  });

  it("한도를 넘으면 실제 퍼센트를 보이고 금액에 text-expense 를 쓴다", () => {
    render(<BudgetSummaryCard summary={summary} />);

    expect(screen.getByText("103%")).toBeInTheDocument();
    expect(screen.getByText("₩410,000")).toHaveClass("text-expense");
    expect(screen.getByText("₩150,000")).not.toHaveClass("text-expense");
  });

  it("한도가 0 이면 쓴 금액만 보이고 막대와 퍼센트를 그리지 않는다", () => {
    render(
      <BudgetSummaryCard
        summary={{
          ...summary,
          living: { spent: 30000, limit: 0 },
          items: [{ budgetItemUuid: "item-1", name: "여행", limit: 0, spent: 70000 }],
        }}
      />
    );

    expect(screen.getByText("₩30,000")).toBeInTheDocument();
    expect(screen.getByText("₩70,000")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
  });

  it("한도 있는 줄만 progressbar 를 그린다", () => {
    render(
      <BudgetSummaryCard
        summary={{
          ...summary,
          items: [{ budgetItemUuid: "item-1", name: "여행", limit: 0, spent: 70000 }],
        }}
      />
    );

    const living = screen.getByText("생활비").closest("div")!.parentElement!;
    expect(within(living).getByRole("progressbar")).toBeInTheDocument();
    const trip = screen.getByText("여행").closest("div")!.parentElement!;
    expect(within(trip).queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("빈 상태에는 안내 한 줄만 보이고 링크는 /budget 이다", () => {
    render(
      <BudgetSummaryCard
        summary={{ ...summary, living: { spent: 0, limit: 0 }, items: [] }}
      />
    );

    expect(screen.getByText("예산 항목을 만들면 여기서 볼 수 있어요")).toBeInTheDocument();
    expect(screen.queryByText("생활비")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "예산 요약, 예산 화면으로 이동" })).toHaveAttribute(
      "href",
      "/budget"
    );
  });
});
