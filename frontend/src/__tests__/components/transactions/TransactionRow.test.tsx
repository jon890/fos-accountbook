import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionRow } from "@/components/transactions/TransactionRow";

const transaction = {
  uuid: "transaction-1",
  amount: 12000,
  description: "점심 식사",
  date: "2026-03-15T12:30:00",
  category: { uuid: "food", name: "식비", icon: "🍚" },
  createdBy: { name: "아내", colorClass: "bg-member-1" },
};

describe("TransactionRow", () => {
  it("설명이 없으면 카테고리명을 제목으로 보여 주고 보조 줄에 반복하지 않는다", () => {
    render(<TransactionRow variant="compact" tx={{ ...transaction, description: null }} />);

    expect(screen.getByText("식비", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "아내 · 12:30")).toBeInTheDocument();
    expect(screen.queryByText((_, element) => element?.tagName === "P" && element.textContent === "식비 · 아내 · 12:30")).not.toBeInTheDocument();
  });

  it("수입은 부호와 수입 색을, 지출은 부호 없이 지출 색을 표시한다", () => {
    const { rerender } = render(<TransactionRow variant="compact" kind="income" tx={transaction} />);

    expect(screen.getByText("+₩12,000")).toHaveClass("text-income");

    rerender(<TransactionRow variant="compact" kind="expense" tx={transaction} />);

    expect(screen.getByText("₩12,000")).toHaveClass("text-expense");
  });

  it("작성자를 보조 줄에 표시하고 Enter로 수정 동작을 실행한다", async () => {
    const onEdit = jest.fn();
    render(<TransactionRow variant="compact" tx={transaction} onEdit={onEdit} />);

    expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "식비 · 아내 · 12:30")).toBeInTheDocument();
    screen.getByRole("button", { name: /점심 식사/ }).focus();
    await userEvent.setup().keyboard("{Enter}");

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("예산 제외 지출의 보조 줄에만 예산 제외를 표시한다", () => {
    const { rerender } = render(
      <TransactionRow variant="compact" tx={{ ...transaction, excludeFromBudget: true }} />
    );

    expect(
      screen.getByText(
        (_, element) => element?.tagName === "P" && element.textContent === "식비 · 아내 · 12:30 · 예산 제외"
      )
    ).toBeInTheDocument();

    rerender(<TransactionRow variant="compact" tx={transaction} />);

    expect(screen.queryByText("예산 제외")).not.toBeInTheDocument();
  });

  it("날짜 없이 metadata와 상태 배지를 렌더링해도 시각을 만들지 않는다", () => {
    render(
      <TransactionRow
        variant="compact"
        metadata="매월 15일"
        trailing={<span>예정</span>}
        tx={{ ...transaction, date: undefined }}
      />
    );

    expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "식비 · 아내 · 매월 15일")).toBeInTheDocument();
    expect(screen.getByText("예정")).toBeInTheDocument();
    expect(screen.queryByText(/00:00/)).not.toBeInTheDocument();
  });

  it("full 행은 보조 줄을 한 번만 렌더링하고 데스크톱에서는 중복 열 값을 숨긴다", () => {
    const { container } = render(<TransactionRow variant="full" tx={transaction} />);

    const details = container.querySelectorAll("p.text-xs.text-fg-muted");
    expect(details).toHaveLength(1);
    expect(details[0]).toHaveTextContent("식비 · 아내 · 12:30");

    const detailSegments = details[0].querySelectorAll(":scope > span");
    expect(detailSegments[0]).toHaveClass("md:hidden");
    expect(detailSegments[1]).toHaveClass("md:hidden");
    expect(detailSegments[2]).not.toHaveClass("md:hidden");
    expect(details[0].querySelectorAll("[aria-hidden='true'].md\\:hidden")).toHaveLength(2);
  });
});
