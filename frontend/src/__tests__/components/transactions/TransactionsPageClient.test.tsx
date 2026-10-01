jest.mock("@/lib/client/navigation", () => ({ useNavigationPending: jest.fn() }));
jest.mock("@/app/(authenticated)/transactions/_components/TransactionsTabs", () => ({
  TransactionsTabs: () => <button>수입</button>,
}));
jest.mock("@/app/(authenticated)/transactions/_components/FilterChips", () => ({
  FilterChips: () => <button>이번달</button>,
}));
jest.mock("@/app/(authenticated)/transactions/_components/SearchBar", () => ({
  SearchBar: () => <input aria-label="거래 내역 검색" />,
}));

import { TransactionsPageClient } from "@/app/(authenticated)/transactions/_components/TransactionsPageClient";
import { useNavigationPending } from "@/lib/client/navigation";
import { render, screen } from "@testing-library/react";

describe("TransactionsPageClient", () => {
  it("주소 전환 중 목록 영역을 흐리게 하고 aria-busy를 표시한다", () => {
    jest.mocked(useNavigationPending).mockReturnValue(true);
    render(<TransactionsPageClient categories={[]} activeTab="expenses" searchParams={{}} expenseListContent={<p>지출 목록</p>} incomeListContent={null} recurringListContent={null} />);

    const content = screen.getByText("지출 목록").parentElement;
    expect(content).toHaveAttribute("aria-busy", "true");
    expect(content).toHaveClass("opacity-60", "pointer-events-none");
  });

  it("주소 전환 중 탭과 필터, 검색 입력을 비활성화한다", () => {
    jest.mocked(useNavigationPending).mockReturnValue(true);
    render(<TransactionsPageClient categories={[]} activeTab="expenses" searchParams={{}} expenseListContent={null} incomeListContent={null} recurringListContent={null} />);

    expect(screen.getByRole("button", { name: "수입" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "이번달" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "거래 내역 검색" })).toBeDisabled();
  });
});
