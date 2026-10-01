import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryExpenseSummary } from "@/components/expenses/summary/CategoryExpenseSummary";
import { useAppRouter } from "@/lib/client/navigation";
import { useSearchParams } from "next/navigation";
import type { CategoryExpenseSummaryResponse } from "@/types/expense";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));
jest.mock("@/lib/client/navigation", () => ({
  useAppRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseAppRouter = useAppRouter as jest.MockedFunction<typeof useAppRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;

const summary: CategoryExpenseSummaryResponse = {
  totalExpense: 21000,
  categoryStats: Array.from({ length: 6 }, (_, index) => ({
    categoryUuid: `category-${index + 1}`,
    categoryName: `카테고리 ${index + 1}`,
    categoryIcon: "🍚",
    categoryColor: "oklch(0.56 0.14 35)",
    totalAmount: (6 - index) * 1000,
    count: index + 1,
    percentage: (6 - index) * 5,
  })),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAppRouter.mockReturnValue({
    isPending: false,
    push: mockPush,
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    bfcacheId: "test-bfcache-id",
  } as ReturnType<typeof useAppRouter>);
  mockUseSearchParams.mockReturnValue(
    new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>,
  );
});

describe("CategoryExpenseSummary", () => {
  it("접힌 상태로 시작하고, 펼치면 상위 다섯 카테고리만 표시한다", async () => {
    const user = userEvent.setup();
    render(<CategoryExpenseSummary summary={summary} />);

    expect(screen.queryByRole("button", { name: /카테고리 1/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /카테고리별 지출/ }));

    expect(screen.getByRole("button", { name: /카테고리 1/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /카테고리 5/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /카테고리 6/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "전체 6개 보기" })).toBeInTheDocument();
  });

  it("전체 보기로 나머지 카테고리를 표시한다", async () => {
    const user = userEvent.setup();
    render(<CategoryExpenseSummary summary={summary} />);

    await user.click(screen.getByRole("button", { name: /카테고리별 지출/ }));
    await user.click(screen.getByRole("button", { name: "전체 6개 보기" }));

    expect(screen.getByRole("button", { name: /카테고리 6/ })).toBeInTheDocument();
  });

  it("URL에 선택된 카테고리 행을 눌린 버튼으로 표시하고 필터를 유지한다", async () => {
    const user = userEvent.setup();
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("tab=expenses&categoryId=category-1") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    render(<CategoryExpenseSummary summary={summary} />);

    // 걸러 보는 카테고리가 있으면 펼친 채 시작한다.
    expect(screen.getByRole("button", { name: /카테고리별 지출/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    const category = screen.getByRole("button", { name: /카테고리 1/ });
    expect(category).toHaveAttribute("aria-pressed", "true");
    await user.click(category);
    expect(mockPush).toHaveBeenCalledWith(
      "/transactions?tab=expenses&categoryId=category-1&page=1",
    );
  });

  it("카테고리 통계가 비면 카테고리 박스를 표시하지 않는다", () => {
    const { container } = render(
      <CategoryExpenseSummary summary={{ totalExpense: 0, categoryStats: [] }} />,
    );

    expect(container.firstChild).toBeNull();
  });
});
