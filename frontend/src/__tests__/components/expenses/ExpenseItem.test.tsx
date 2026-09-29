/**
 * ExpenseItem 컴포넌트 테스트
 *
 * 테스트 범위:
 * - 렌더링 확인
 * - Props 데이터 표시
 * - 수정 버튼 호버 동작
 * - 날짜 포맷팅
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpenseItem } from "@/components/expenses/list/ExpenseItem";

describe("ExpenseItem", () => {
  const mockExpense = {
    uuid: "test-uuid-123",
    amount: "50000",
    description: "마트 장보기",
    date: "2025-01-15T10:00:00",
    categoryUuid: "category-uuid",
    categoryName: "식비",
    categoryColor: "#FF6B6B",
    categoryIcon: "🍔",
  };

  it("지출 정보를 올바르게 렌더링한다", () => {
    // Given & When
    render(<ExpenseItem expense={mockExpense} />);

    // Then
    expect(screen.getByText("마트 장보기")).toBeInTheDocument();
    expect(screen.getByText("-₩50,000")).toBeInTheDocument();
    // 카테고리명은 서브텍스트에 "식비 · 날짜" 형태로 포함됨
    expect(screen.getAllByText(/식비/).length).toBeGreaterThan(0);
  });

  it("설명이 없으면 카테고리 이름을 표시한다", () => {
    // Given
    const expenseWithoutDescription = {
      ...mockExpense,
      description: undefined,
    };

    // When
    render(<ExpenseItem expense={expenseWithoutDescription} />);

    // Then
    // 설명이 없으면 카테고리명이 메인 타이틀로 표시됨
    const categoryTexts = screen.getAllByText("식비");
    expect(categoryTexts.length).toBeGreaterThan(0);
  });

  it("날짜를 한국어 형식으로 표시한다", () => {
    // Given & When
    render(<ExpenseItem expense={mockExpense} />);

    // Then
    // "1월 15일 (수) 10:00" 형식
    expect(screen.getByText(/1월 15일/)).toBeInTheDocument();
  });

  it("금액을 천 단위로 구분하여 표시한다", () => {
    // Given
    const largeAmountExpense = {
      ...mockExpense,
      amount: "1234567",
    };

    // When
    render(<ExpenseItem expense={largeAmountExpense} />);

    // Then
    expect(screen.getByText("-₩1,234,567")).toBeInTheDocument();
  });

  it("수정 버튼이 있으면 수정 아이콘을 렌더링한다", () => {
    // Given
    const onEdit = jest.fn();

    // When
    const { container } = render(
      <ExpenseItem expense={mockExpense} onEdit={onEdit} />
    );

    // Then
    const editButton = container.querySelector("button");
    expect(editButton).toBeInTheDocument();
  });

  it("수정 버튼 클릭 시 onEdit 콜백이 호출된다", async () => {
    // Given
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const { container } = render(
      <ExpenseItem expense={mockExpense} onEdit={onEdit} />
    );

    // When
    const editButton = container.querySelector("button");
    if (editButton) {
      await user.click(editButton);
    }

    // Then
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("수정 버튼이 없으면 버튼을 렌더링하지 않는다", () => {
    // Given & When
    const { container } = render(<ExpenseItem expense={mockExpense} />);

    // Then
    const editButton = container.querySelector("button");
    expect(editButton).not.toBeInTheDocument();
  });

  it("카테고리 색상을 적용한다", () => {
    // Given & When
    const { container } = render(<ExpenseItem expense={mockExpense} />);

    // Then
    const coloredElement = container.querySelector(
      '[style*="background-color"]'
    );
    expect(coloredElement).toBeInTheDocument();
  });
});
