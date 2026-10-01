import { render, screen } from "@testing-library/react";
import { TransactionFormFields } from "@/components/transactions/forms/TransactionFormFields";
import type { CategoryResponse } from "@/types/category";

jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: jest.fn(() => true),
}));

const categories: CategoryResponse[] = [
  {
    uuid: "expense-category",
    familyUuid: "family-1",
    type: "EXPENSE",
    name: "식비",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    uuid: "income-category",
    familyUuid: "family-1",
    type: "INCOME",
    name: "급여",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
];

function renderFields(type: "expense" | "income" | "recurring") {
  return render(
    <TransactionFormFields
      type={type}
      categories={categories}
      amount={0}
      onAmountChange={jest.fn()}
      categoryUuid={null}
      onCategoryChange={jest.fn()}
      description=""
      onDescriptionChange={jest.fn()}
      isLoadingCategories={false}
    />,
  );
}

describe("TransactionFormFields", () => {
  it("수입 등록에는 수입 카테고리만 표시한다", () => {
    renderFields("income");

    expect(screen.getByRole("radio", { name: "급여" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "식비" })).not.toBeInTheDocument();
  });

  it.each(["expense", "recurring"] as const)("%s 등록에는 지출 카테고리만 표시한다", (type) => {
    renderFields(type);

    expect(screen.getByRole("radio", { name: "식비" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "급여" })).not.toBeInTheDocument();
  });
});
