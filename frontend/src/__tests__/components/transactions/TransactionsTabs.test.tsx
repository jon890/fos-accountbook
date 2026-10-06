import { render, screen } from "@testing-library/react";
import { TransactionsTabs } from "@/app/(authenticated)/transactions/_components/TransactionsTabs";

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("tab=expenses"),
}));
jest.mock("@/lib/client/navigation", () => ({
  useAppRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useNavigationPending: () => false,
}));

describe("TransactionsTabs", () => {
  it("지출, 수입, 반복지출, 할부 탭 네 개를 그린다", () => {
    render(<TransactionsTabs activeTab="expenses" />);

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "지출",
      "수입",
      "반복지출",
      "할부",
    ]);
  });

  it("할부 탭이 활성이면 할부만 선택 상태다", () => {
    render(<TransactionsTabs activeTab="installments" />);

    expect(screen.getByRole("tab", { name: "할부" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "지출" })).toHaveAttribute("aria-selected", "false");
  });
});
