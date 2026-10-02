import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterSheet } from "@/app/(authenticated)/transactions/_components/FilterSheet";
import { useAppRouter, useNavigationPending } from "@/lib/client/navigation";
import { useSearchParams } from "next/navigation";
import type { CategoryResponse } from "@/types/category";

jest.mock("next/navigation", () => ({ useSearchParams: jest.fn() }));
jest.mock("@/lib/client/navigation", () => ({
  useAppRouter: jest.fn(),
  useNavigationPending: jest.fn(),
}));
jest.mock("@/lib/client/timezone-context", () => ({
  useTimeZone: () => ({ timezone: "Asia/Seoul" }),
}));
jest.mock("@/lib/utils/date-timezone", () => ({
  getMonthRange: () => ({ startDate: "2026-10-01", endDate: "2026-10-31" }),
  getLastNMonthsRange: () => ({ startDate: "2026-07-02", endDate: "2026-10-02" }),
  getLastYearRange: () => ({ startDate: "2025-10-02", endDate: "2026-10-02" }),
}));

const mockReplace = jest.fn();
const mockSearchParams = jest.mocked(useSearchParams);

function category(uuid: string, name: string, type: CategoryResponse["type"]): CategoryResponse {
  return {
    uuid,
    familyUuid: "f1",
    type,
    name,
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  };
}

const categories = [
  category("c-food", "식비", "EXPENSE"),
  category("c-pay", "급여", "INCOME"),
];

function setQuery(query: string) {
  mockSearchParams.mockReturnValue(new URLSearchParams(query) as unknown as ReturnType<typeof useSearchParams>);
}

function renderSheet(categoryType: CategoryResponse["type"] = "EXPENSE") {
  return render(<FilterSheet categories={categories} categoryType={categoryType} />);
}

describe("FilterSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAppRouter).mockReturnValue({ replace: mockReplace } as unknown as ReturnType<typeof useAppRouter>);
    jest.mocked(useNavigationPending).mockReturnValue(false);
    setQuery("tab=expenses&q=%EC%BB%A4%ED%94%BC");
  });

  it("적용 중인 필터가 없으면 배지를 보이지 않는다", () => {
    renderSheet();
    expect(screen.queryByTestId("filter-badge")).toBeNull();
  });

  it("기본값과 다른 항목 수를 배지로 보인다", () => {
    setQuery("startDate=2026-09-05&endDate=2026-09-20&amountMin=1000");
    renderSheet();
    expect(screen.getByTestId("filter-badge")).toHaveTextContent("2");
  });

  it("탭 종류에 맞는 카테고리만 보인다", async () => {
    const user = userEvent.setup();
    renderSheet("INCOME");
    await user.click(screen.getByRole("button", { name: "필터" }));
    expect(screen.getByRole("button", { name: /급여/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /식비/ })).toBeNull();
  });

  it("초기화는 draft 만 기본값으로 바꾸고 적용 전에는 이동하지 않는다", async () => {
    const user = userEvent.setup();
    setQuery("tab=expenses&categoryId=c-food&amountMin=1000");
    renderSheet();
    await user.click(screen.getByRole("button", { name: /^필터/ }));
    expect(screen.getByRole("spinbutton", { name: "최솟값 금액" })).toHaveValue(1000);

    await user.click(screen.getByRole("button", { name: "초기화" }));

    expect(screen.getByRole("spinbutton", { name: "최솟값 금액" })).toHaveValue(null);
    expect(screen.getByRole("button", { name: "전체 카테고리" })).toHaveAttribute("aria-pressed", "true");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("초기화 뒤 적용하면 필터를 지운 주소로 한 번만 이동하고 tab 과 q 를 보존한다", async () => {
    const user = userEvent.setup();
    setQuery("tab=incomes&q=%EA%B8%89%EC%97%AC&categoryId=c-pay&amountMin=1000&limit=600");
    renderSheet("INCOME");
    await user.click(screen.getByRole("button", { name: /^필터/ }));
    await user.click(screen.getByRole("button", { name: "초기화" }));
    await user.click(screen.getByRole("button", { name: "적용" }));

    expect(mockReplace).toHaveBeenCalledTimes(1);
    const params = new URL(mockReplace.mock.calls[0][0], "http://x").searchParams;
    expect(params.get("tab")).toBe("incomes");
    expect(params.get("q")).toBe("급여");
    expect(params.has("categoryId")).toBe(false);
    expect(params.has("amountMin")).toBe(false);
    expect(params.has("limit")).toBe(false);
  });

  it("금액을 넣고 적용하면 입력값을 담아 한 번 이동한다", async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole("button", { name: "필터" }));
    await user.type(screen.getByRole("spinbutton", { name: "최솟값 금액" }), "5000");
    await user.click(screen.getByRole("button", { name: "적용" }));

    expect(mockReplace).toHaveBeenCalledTimes(1);
    const params = new URL(mockReplace.mock.calls[0][0], "http://x").searchParams;
    expect(params.get("amountMin")).toBe("5000");
    expect(params.get("q")).toBe("커피");
  });

  it("최소가 최대보다 크면 안내하고 이동하지 않는다", async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole("button", { name: "필터" }));
    await user.type(screen.getByRole("spinbutton", { name: "최솟값 금액" }), "9000");
    await user.type(screen.getByRole("spinbutton", { name: "최댓값 금액" }), "1000");
    await user.click(screen.getByRole("button", { name: "적용" }));

    expect(screen.getByRole("alert")).toHaveTextContent("최소 금액은 최대 금액보다 클 수 없습니다");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("직접 입력한 종료일이 시작일보다 이르면 안내하고 이동하지 않는다", async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole("button", { name: "필터" }));
    await user.click(screen.getByRole("button", { name: "직접 입력" }));
    await user.clear(screen.getByLabelText("시작일"));
    await user.type(screen.getByLabelText("시작일"), "2026-10-20");
    await user.clear(screen.getByLabelText("종료일"));
    await user.type(screen.getByLabelText("종료일"), "2026-10-10");
    await user.click(screen.getByRole("button", { name: "적용" }));

    expect(screen.getByRole("alert")).toHaveTextContent("종료일은 시작일 이후여야 합니다");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("닫으면 이동하지 않고 다시 열면 현재 주소의 값으로 시작한다", async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole("button", { name: "필터" }));
    await user.type(screen.getByRole("spinbutton", { name: "최솟값 금액" }), "7000");
    await user.keyboard("{Escape}");
    expect(mockReplace).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "필터" }));
    expect(screen.getByRole("spinbutton", { name: "최솟값 금액" })).toHaveValue(null);
  });
});
