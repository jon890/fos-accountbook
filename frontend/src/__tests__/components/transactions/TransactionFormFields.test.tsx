import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { TransactionFormFields } from "@/components/transactions/forms/TransactionFormFields";

jest.mock("@/hooks/useMediaQuery", () => ({ useMediaQuery: () => true }));

const categories = [
  {
    uuid: "normal",
    familyUuid: "family-1",
    name: "식비",
    icon: "🍚",
    excludeFromBudget: false,
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    uuid: "excluded",
    familyUuid: "family-1",
    name: "비상금",
    icon: "💰",
    excludeFromBudget: true,
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
];

function renderFields(type: "expense" | "income", categoryUuid = "normal", excludeFromBudget = false) {
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
  it("지출일 때만 예산 제외 스위치를 렌더링한다", () => {
    const { rerender } = renderFields("expense");
    expect(screen.getByRole("switch", { name: "예산에서 제외" })).toBeInTheDocument();

    rerender(
      <TransactionFormFields
        type="income"
        categories={categories}
        amount={1000}
        onAmountChange={() => {}}
        categoryUuid="normal"
        onCategoryChange={() => {}}
        description=""
        onDescriptionChange={() => {}}
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

    render(
      <ControlledFields />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "식비" }));
    const switchButton = screen.getByRole("switch", { name: "예산에서 제외" });
    expect(switchButton).toBeEnabled();
    expect(switchButton).toBeChecked();
  });
});
