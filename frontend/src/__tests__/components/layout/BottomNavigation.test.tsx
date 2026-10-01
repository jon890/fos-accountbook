import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname, useSearchParams } from "next/navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock("@/components/transactions/dialogs/AddTransactionDialog", () => ({
  AddTransactionDialog: ({
    open,
    defaultDate,
  }: {
    open: boolean;
    defaultDate?: string;
  }) => (open ? <div role="dialog">{defaultDate ?? "오늘"}</div> : null),
}));

beforeEach(() => {
  jest.mocked(usePathname).mockReturnValue("/calendar");
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
});

it("네 링크와 추가 버튼을 표시하고 현재 탭을 알린다", () => {
  render(<BottomNavigation />);
  expect(screen.getAllByRole("link")).toHaveLength(4);
  const links = [
    ["달력", "/calendar"],
    ["내역", "/transactions"],
    ["분석", "/analytics"],
    ["전체", "/menu"],
  ];

  for (const [name, href] of links) {
    expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
  }
  expect(screen.getByRole("link", { name: "달력" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("button", { name: "지출 추가" })).toBeInTheDocument();
});

it.each([["/transactions", "내역"], ["/transactions/detail", "내역"], ["/expenses/detail", "내역"], ["/analytics/month", "분석"], ["/menu", "전체"]])("%s에서 %s 탭이 활성화된다", (pathname, name) => {
  jest.mocked(usePathname).mockReturnValue(pathname);
  render(<BottomNavigation />);
  expect(screen.getByRole("link", { name })).toHaveAttribute("aria-current", "page");
  expect(screen.getAllByRole("link").filter((link) => link.hasAttribute("aria-current"))).toHaveLength(1);
});

it.each(["/families/create", "/families/select", "/invite/token"])("%s에서 탭과 추가 버튼을 숨긴다", (pathname) => {
  jest.mocked(usePathname).mockReturnValue(pathname);
  const { container } = render(<BottomNavigation />);
  expect(container).toBeEmptyDOMElement();
});

it("달력의 선택일을 FAB 다이얼로그에 전달하고 URL 변경도 반영한다", async () => {
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams("date=2026-09-14"));
  const { rerender } = render(<BottomNavigation />);
  await userEvent.setup().click(screen.getByRole("button", { name: "지출 추가" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("2026-09-14");
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams("date=2026-09-15"));
  rerender(<BottomNavigation />);
  expect(screen.getByRole("dialog")).toHaveTextContent("2026-09-15");
});

it.each(["/calendar", "/menu"])("선택일이 없는 %s에서는 오늘을 기본값으로 쓴다", async (pathname) => {
  jest.mocked(usePathname).mockReturnValue(pathname);
  render(<BottomNavigation />);
  await userEvent.setup().click(screen.getByRole("button", { name: "지출 추가" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("오늘");
});

it("다른 화면에서는 date 쿼리가 있어도 오늘을 쓴다", async () => {
  jest.mocked(usePathname).mockReturnValue("/transactions");
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams("date=2026-09-14"));
  render(<BottomNavigation />);
  await userEvent.setup().click(screen.getByRole("button", { name: "지출 추가" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("오늘");
});
