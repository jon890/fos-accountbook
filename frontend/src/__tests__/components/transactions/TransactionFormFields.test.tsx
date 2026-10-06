import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { TransactionFormFields } from "@/components/transactions/forms/TransactionFormFields";
import type { CategoryResponse } from "@/types/category";

jest.mock("@/hooks/useMediaQuery", () => ({ useMediaQuery: () => true }));

const categories: CategoryResponse[] = [
  {
    uuid: "normal",
    familyUuid: "family-1",
    type: "EXPENSE",
    name: "식비",
    icon: "🍚",
    excludeFromBudget: false,
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    uuid: "excluded",
    familyUuid: "family-1",
    type: "EXPENSE",
    name: "비상금",
    icon: "💰",
    excludeFromBudget: true,
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    uuid: "income-category",
    familyUuid: "family-1",
    type: "INCOME",
    name: "급여",
    icon: "💵",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
];

function renderFields(
  type: "expense" | "income" | "recurring",
  categoryUuid = "normal",
  excludeFromBudget = false,
) {
  return render(
    <TransactionFormFields
      type={type}
      categories={categories}
      amount={1000}
      onAmountChange={() => {}}
      categoryUuid={categoryUuid}
      onCategoryChange={() => {}}
      description=""
      onDescriptionChange={() => {}}
      excludeFromBudget={excludeFromBudget}
      onExcludeFromBudgetChange={() => {}}
      date="2026-10-01"
      onDateChange={() => {}}
      isLoadingCategories={false}
    />,
  );
}

describe("TransactionFormFields", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-02T12:00:00+09:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("수입 등록에는 수입 카테고리만 표시한다", () => {
    renderFields("income");

    expect(screen.getByRole("radio", { name: "급여" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "식비" })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "비상금 예산 제외" })).not.toBeInTheDocument();
  });

  it.each(["expense", "recurring"] as const)("%s 등록에는 지출 카테고리만 표시한다", (type) => {
    renderFields(type);

    expect(screen.getByRole("radio", { name: "식비" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "급여" })).not.toBeInTheDocument();
  });

  it("지출일 때만 예산 제외 스위치를 렌더링한다", () => {
    const { rerender } = renderFields("expense");
    expect(screen.getByRole("switch", { name: "예산에서 제외" })).toBeInTheDocument();

    rerender(
      <TransactionFormFields
        type="income"
        categories={categories}
        amount={1000}
        onAmountChange={() => {}}
        categoryUuid="income-category"
        onCategoryChange={() => {}}
        description=""
        onDescriptionChange={() => {}}
        date="2026-10-01"
        onDateChange={() => {}}
        isLoadingCategories={false}
      />,
    );

    expect(screen.queryByRole("switch", { name: "예산에서 제외" })).not.toBeInTheDocument();
  });

  it("예산 제외 카테고리는 스위치를 켜고 잠근다", () => {
    renderFields("expense", "excluded");

    expect(screen.getByRole("switch", { name: "예산에서 제외" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "예산에서 제외" })).toBeDisabled();
    expect(screen.getByText("이 카테고리는 예산에서 제외돼요")).toBeInTheDocument();
  });

  it("카테고리 잠금 중에도 지출 자체의 제외 값을 그대로 보낸다", () => {
    const { container } = renderFields("expense", "excluded", true);
    const hidden = container.querySelector<HTMLInputElement>('input[name="excludeFromBudget"]');

    expect(hidden?.value).toBe("true");
  });

  it("카테고리를 바꾸면 이전 사용자의 스위치 값을 유지한다", () => {
    function ControlledFields() {
      const [categoryUuid, setCategoryUuid] = useState<string | null>("excluded");
      const [excludeFromBudget, setExcludeFromBudget] = useState(true);

      return (
        <TransactionFormFields
          type="expense"
          categories={categories}
          amount={1000}
          onAmountChange={() => {}}
          categoryUuid={categoryUuid}
          onCategoryChange={setCategoryUuid}
          description=""
          onDescriptionChange={() => {}}
          excludeFromBudget={excludeFromBudget}
          onExcludeFromBudgetChange={setExcludeFromBudget}
          date="2026-10-01"
          onDateChange={() => {}}
          isLoadingCategories={false}
        />
      );
    }

    render(<ControlledFields />);

    fireEvent.click(screen.getByRole("radio", { name: "식비" }));

    const switchButton = screen.getByRole("switch", { name: "예산에서 제외" });
    expect(switchButton).toBeEnabled();
    expect(switchButton).toBeChecked();
  });

  it("어제를 누르면 로컬 달력 기준 하루 전 날짜를 전달한다", () => {
    const onDateChange = jest.fn();
    render(
      <TransactionFormFields
        type="expense"
        categories={categories}
        amount={1000}
        onAmountChange={() => {}}
        categoryUuid="normal"
        onCategoryChange={() => {}}
        description=""
        onDescriptionChange={() => {}}
        date="2026-10-02"
        onDateChange={onDateChange}
        isLoadingCategories={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "어제" }));

    expect(onDateChange).toHaveBeenCalledWith("2026-10-01");
  });

  it("결제일을 지우면 빈 값을 유지한다", () => {
    const onDayOfMonthChange = jest.fn();
    render(
      <TransactionFormFields
        type="recurring"
        categories={categories}
        amount={1000}
        onAmountChange={() => {}}
        categoryUuid="normal"
        onCategoryChange={() => {}}
        description=""
        onDescriptionChange={() => {}}
        dayOfMonth={15}
        onDayOfMonthChange={onDayOfMonthChange}
        isLoadingCategories={false}
      />,
    );

    fireEvent.change(screen.getByLabelText("매월 결제일 *"), {
      target: { value: "" },
    });

    expect(onDayOfMonthChange).toHaveBeenCalledWith(undefined);
  });
});
