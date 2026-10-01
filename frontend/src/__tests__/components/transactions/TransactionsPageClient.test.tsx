jest.mock("@/lib/client/navigation", () => ({ useNavigationPending: jest.fn() }));
jest.mock("@/app/(authenticated)/transactions/_components/TransactionsTabs", () => ({ TransactionsTabs: () => <div /> }));
jest.mock("@/app/(authenticated)/transactions/_components/FilterChips", () => ({ FilterChips: () => <div /> }));
jest.mock("@/app/(authenticated)/transactions/_components/SearchBar", () => ({ SearchBar: () => <div /> }));

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
});
