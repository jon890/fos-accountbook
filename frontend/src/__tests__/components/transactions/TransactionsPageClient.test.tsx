jest.mock("@/lib/client/navigation", () => ({ useNavigationPending: jest.fn() }));
jest.mock("@/app/(authenticated)/transactions/_components/TransactionsTabs", () => ({
  TransactionsTabs: () => <button>수입</button>,
}));
jest.mock("@/app/(authenticated)/transactions/_components/FilterChips", () => ({
  FilterChips: () => <button>이번달</button>,
}));
jest.mock("@/app/(authenticated)/transactions/_components/FilterSheet", () => ({
  FilterSheet: () => <button>필터</button>,
}));
jest.mock("@/hooks/useMediaQuery", () => ({ useMediaQuery: jest.fn() }));
jest.mock("@/app/(authenticated)/transactions/_components/SearchBar", () => ({
  SearchBar: () => <input aria-label="거래 내역 검색" />,
}));

import { TransactionsPageClient } from "@/app/(authenticated)/transactions/_components/TransactionsPageClient";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useNavigationPending } from "@/lib/client/navigation";
import { render, screen } from "@testing-library/react";

describe("TransactionsPageClient", () => {
  beforeEach(() => {
    jest.mocked(useMediaQuery).mockReturnValue(true);
  });

  it("주소 전환 중 목록 영역을 흐리게 하고 aria-busy를 표시한다", () => {
    jest.mocked(useNavigationPending).mockReturnValue(true);
    render(<TransactionsPageClient categories={[]} activeTab="expenses" searchParams={{}} expenseListContent={<p>지출 목록</p>} incomeListContent={null} recurringListContent={null} />);

    const content = screen.getByText("지출 목록").parentElement;
    expect(content).toHaveAttribute("aria-busy", "true");
    expect(content).toHaveClass("opacity-60", "pointer-events-none");
  });

  it("주소 전환 중 탭과 필터는 비활성화하고 검색 입력은 받는다", () => {
    jest.mocked(useNavigationPending).mockReturnValue(true);
    render(<TransactionsPageClient categories={[]} activeTab="expenses" searchParams={{}} expenseListContent={null} incomeListContent={null} recurringListContent={null} />);

    expect(screen.getByRole("button", { name: "수입" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "이번달" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "거래 내역 검색" })).toBeEnabled();
  });

  it("필터 칩과 필터 버튼을 함께 그리고 폭에 따라 CSS 로 하나만 보인다", () => {
    jest.mocked(useNavigationPending).mockReturnValue(false);
    render(<TransactionsPageClient categories={[]} activeTab="expenses" searchParams={{}} expenseListContent={null} incomeListContent={null} recurringListContent={null} />);

    // 폭별로 실제 하나만 보이는지는 browser/transactions.spec.ts 가 390px, 1280px 에서 확인한다.
    expect(screen.getByRole("button", { name: "이번달" }).closest(".hidden.md\\:block")).not.toBeNull();
    expect(screen.getByRole("button", { name: "필터" }).closest(".md\\:hidden")).not.toBeNull();
  });
});
