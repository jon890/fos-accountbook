import { render, screen } from "@testing-library/react";
import { CategoryDetailList } from "@/app/(authenticated)/analytics/_components/CategoryDetailList";
import type { CategoryWithDelta } from "@/types/analytics";

function item(overrides: Partial<CategoryWithDelta>): CategoryWithDelta {
  return {
    categoryUuid: "food",
    name: "식비",
    icon: "🍔",
    totalAmount: 10000,
    percentage: 50,
    deltaPercent: null,
    isNew: false,
    ...overrides,
  };
}

describe("CategoryDetailList 전월 대비 표시", () => {
  it("직전 달 0원에서 새로 생긴 카테고리는 「신규」 로 보인다", () => {
    render(
      <CategoryDetailList
        totalExpense={20000}
        items={[item({ categoryUuid: "gift", name: "선물", isNew: true })]}
      />,
    );

    expect(screen.getByText("신규")).toBeInTheDocument();
  });

  it("비교할 수 없으면 「—」, 증감이 있으면 부호와 비율을 보인다", () => {
    render(
      <CategoryDetailList
        totalExpense={20000}
        items={[
          item({ categoryUuid: "a", name: "가", deltaPercent: null }),
          item({ categoryUuid: "b", name: "나", deltaPercent: 25 }),
        ]}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText(/25%/)).toBeInTheDocument();
    expect(screen.queryByText("신규")).toBeNull();
  });
});
