import { act, fireEvent, render, screen } from "@testing-library/react";
import { AmountRangeFilter } from "@/app/(authenticated)/transactions/_components/AmountRangeFilter";
import { SearchBar } from "@/app/(authenticated)/transactions/_components/SearchBar";
import { TransactionsTabs } from "@/app/(authenticated)/transactions/_components/TransactionsTabs";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let isNavigationPending = false;

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("tab=expenses"),
}));
jest.mock("@/lib/client/navigation", () => ({
  useAppRouter: () => ({ push: mockPush, replace: mockReplace }),
  useNavigationPending: () => isNavigationPending,
}));

describe("내역 화면 주소 전환 트리거", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isNavigationPending = false;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("대기 중에는 탭 이동을 추가로 호출하지 않는다", () => {
    isNavigationPending = true;
    render(<TransactionsTabs activeTab="expenses" />);

    expect(screen.getByRole("tab", { name: "수입" })).toBeDisabled();
    fireEvent.click(screen.getByRole("tab", { name: "수입" }));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("대기 중에도 검색 입력을 받고 디바운스 뒤 마지막 검색어로 주소를 바꾼다", () => {
    jest.useFakeTimers();
    isNavigationPending = true;
    render(<SearchBar />);

    const input = screen.getByRole("textbox", { name: "거래 내역 검색" });
    expect(input).toBeEnabled();
    fireEvent.change(input, { target: { value: "점심" } });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(input).toHaveValue("점심");
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining("q=%EC%A0%90%EC%8B%AC"));
  });

  it("대기 중에는 포털의 금액 범위 적용을 추가로 호출하지 않는다", () => {
    const view = render(<AmountRangeFilter />);
    fireEvent.click(screen.getByRole("button", { name: "금액 범위 필터" }));
    expect(screen.getByRole("button", { name: "적용" })).toBeEnabled();

    isNavigationPending = true;
    view.rerender(<AmountRangeFilter />);

    const applyButton = screen.getByRole("button", { name: "적용" });
    expect(applyButton).toBeDisabled();
    fireEvent.click(applyButton);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
