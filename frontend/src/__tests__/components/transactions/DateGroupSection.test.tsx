import { render, screen } from "@testing-library/react";
import { DateGroupSection } from "@/components/transactions/DateGroupSection";

const group = {
  dateKey: "2026-03-15",
  label: "3월 15일 (일)",
  totalAmount: 12000,
  items: [{
    uuid: "transaction-1",
    amount: 12000,
    description: "점심 식사",
    date: "2026-03-15T12:00:00",
    category: { uuid: "food", name: "식비", icon: "🍚" },
  }],
};

describe("DateGroupSection", () => {
  it("날짜 머리에서 해당 날짜가 선택된 달력으로 이동한다", () => {
    render(<DateGroupSection group={group} />);

    expect(screen.getByRole("link", { name: /3월 15일/ })).toHaveAttribute(
      "href",
      "/calendar?month=2026-03&date=2026-03-15"
    );
  });

  it("혼합 날짜 그룹에는 지출과 수입 합계를 함께 표시한다", () => {
    render(<DateGroupSection group={group} incomeTotal={34000} />);

    expect(screen.getByRole("link", { name: /3월 15일/ }).querySelector(".text-expense")).toHaveTextContent("₩12,000");
    expect(screen.getByText("+₩34,000")).toHaveClass("text-income");
  });
});
