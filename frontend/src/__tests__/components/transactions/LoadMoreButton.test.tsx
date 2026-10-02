import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoadMoreButton } from "@/components/transactions/LoadMoreButton";
import { useAppRouter } from "@/lib/client/navigation";
import { useSearchParams } from "next/navigation";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));
jest.mock("@/lib/client/navigation", () => ({
  useAppRouter: jest.fn(),
}));

const mockReplace = jest.fn();
const mockUseAppRouter = useAppRouter as jest.MockedFunction<typeof useAppRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;

describe("LoadMoreButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppRouter.mockReturnValue({
      push: jest.fn(),
      replace: mockReplace,
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
      bfcacheId: "",
      isPending: false,
    } as ReturnType<typeof useAppRouter>);
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("tab=expenses&startDate=2026-10-01") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
  });

  it("남은 내역이 있을 때만 표시한다", () => {
    const { rerender } = render(
      <LoadMoreButton loadedCount={300} totalElements={301} limit={300} />,
    );

    expect(screen.getByRole("button", { name: "더 보기 (1건 남음)" })).toBeInTheDocument();

    rerender(<LoadMoreButton loadedCount={300} totalElements={300} limit={300} />);
    expect(screen.queryByRole("button", { name: /더 보기/ })).not.toBeInTheDocument();
  });

  it("누르면 limit을 300 늘리고 스크롤을 유지한다", async () => {
    const user = userEvent.setup();
    render(<LoadMoreButton loadedCount={300} totalElements={601} limit={300} />);

    await user.click(screen.getByRole("button", { name: "더 보기 (301건 남음)" }));

    expect(mockReplace).toHaveBeenCalledWith(
      "/transactions?tab=expenses&startDate=2026-10-01&limit=600",
      { scroll: false },
    );
  });

  it("3000건에서는 다시 요청하지 않고 기간 안내를 보인다", () => {
    render(<LoadMoreButton loadedCount={3000} totalElements={3001} limit={3000} />);

    expect(screen.queryByRole("button", { name: /더 보기/ })).not.toBeInTheDocument();
    expect(screen.getByText("최대 3000건까지 불러왔어요. 조회 기간을 줄여 주세요")).toBeInTheDocument();
  });
});
