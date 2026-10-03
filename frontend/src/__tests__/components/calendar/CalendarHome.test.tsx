import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarHome } from "@/components/calendar/CalendarHome";
import CalendarPage from "@/app/(authenticated)/calendar/page";
import { getCalendarMonthAction } from "@/actions/calendar/get-calendar-month-action";
import { calendarExpense, calendarIncome, calendarMonth } from "@/test-fixtures/calendar";
import type { Expense } from "@/types/expense";
import type { Income } from "@/types/income";

const mockPush = jest.fn();
const mockEditLoadError = jest.fn();
const mockSearchParams = jest.fn();
const mockNavigationPending = jest.fn();
const mockScrollIntoView = jest.fn();
jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams(),
}));
jest.mock("@/lib/client/navigation", () => ({
  useAppRouter: () => ({ push: mockPush }),
  useNavigationPending: () => mockNavigationPending(),
}));
jest.mock("@/actions/calendar/get-calendar-month-action", () => ({ getCalendarMonthAction: jest.fn() }));
jest.mock("@/lib/server/auth", () => ({ auth: async () => ({ user: { profile: { defaultFamilyUuid: "family-1", timezone: "Asia/Seoul" } } }) }));
jest.mock("@/components/transactions/dialogs/AddTransactionDialog", () => ({
  AddTransactionDialog: ({ open, defaultDate, onOpenChange }: { open: boolean; defaultDate: string; onOpenChange: (open: boolean) => void }) => open ? <div role="dialog" aria-label="추가">{defaultDate}<button onClick={() => onOpenChange(false)}>닫기</button></div> : null,
}));
jest.mock("@/components/transactions/dialogs/EditTransactionDialog", () => ({
  EditTransactionDialog: function MockEditDialog({ type, transaction, familyUuid, onOpenChange }: { type: string; transaction: Expense | Income; familyUuid: string; onOpenChange: (open: boolean) => void }) {
    const { useEffect } = jest.requireActual<typeof import("react")>("react");
    useEffect(() => {
      mockEditLoadError();
    }, [onOpenChange]);
    return <div role="dialog" aria-label="수정">{type} {transaction.uuid} {transaction.description} {familyUuid}<button onClick={() => onOpenChange(false)}>닫기</button></div>;
  },
}));

const data = calendarMonth();
const props = { data, initialDate: "2026-09-14", today: "2026-09-14", familyUuid: "family-1" };

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: mockScrollIntoView,
  });
  mockSearchParams.mockImplementation(() => new URLSearchParams(window.location.search));
  mockNavigationPending.mockReturnValue(false);
  window.history.replaceState({}, "", "/calendar?month=2026-09&date=2026-09-14");
  jest.mocked(getCalendarMonthAction).mockResolvedValue({ success: true, data });
});

describe("달력 홈", () => {
  it("날짜를 누르면 선택 날짜의 목록 제목에 포커스를 준다", async () => {
    render(<CalendarHome {...props} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "9월 15일" }));

    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "9월 15일 (화)" }));
  });

  it("처음 렌더와 월 이동에는 스크롤이나 제목 포커스를 하지 않는다", async () => {
    const view = render(<CalendarHome {...props} />);
    expect(mockScrollIntoView).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "9월 14일 (월)" })).not.toHaveFocus();

    await userEvent.setup().click(screen.getByRole("button", { name: "다음 달" }));
    view.rerender(<CalendarHome {...props} data={calendarMonth({ month: 10 })} initialDate="2026-10-01" />);

    expect(mockScrollIntoView).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "10월 1일 (목)" })).not.toHaveFocus();
  });

  it("월 전환 중 달력 격자와 날짜 목록 영역을 흐리게 하고 aria-busy를 표시한다", () => {
    mockNavigationPending.mockReturnValue(true);
    const { container } = render(<CalendarHome {...props} />);

    const pendingRegion = container.querySelector('[aria-busy="true"]');
    expect(pendingRegion).toHaveClass("opacity-60", "pointer-events-none");
  });

  it("월 전환 중에는 이전 달과 다음 달 버튼을 비활성화하고 이동을 추가로 호출하지 않는다", async () => {
    mockNavigationPending.mockReturnValue(true);
    render(<CalendarHome {...props} />);

    const previousMonthButton = screen.getByRole("button", { name: "이전 달" });
    const nextMonthButton = screen.getByRole("button", { name: "다음 달" });
    expect(previousMonthButton).toBeDisabled();
    expect(nextMonthButton).toBeDisabled();

    await userEvent.setup().click(nextMonthButton);
    expect(mockPush).not.toHaveBeenCalled();
  });
  it.each(["/calendar?month=2026-08", "/calendar?month=2026-08&date=invalid"])("초기 URL %s의 날짜를 서버가 선택한 날짜로 맞춘다", (url) => {
    window.history.replaceState({}, "", url);
    render(<CalendarHome {...props} data={calendarMonth({ month: 8 })} initialDate="2026-08-01" />);

    expect(window.location.search).toBe("?month=2026-08&date=2026-08-01");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("최초 조회 뒤 날짜 변경은 서버를 다시 부르지 않고 URL과 목록만 바꾼다", async () => {
    render(await CalendarPage({ searchParams: Promise.resolve({ month: "2026-09", date: "2026-09-14" }) }));
    expect(getCalendarMonthAction).toHaveBeenCalledTimes(1);
    expect(screen.getByText("점심")).toBeInTheDocument();
    const replace = jest.spyOn(window.history, "replaceState");
    await userEvent.setup().click(screen.getByRole("button", { name: "9월 15일" }));
    expect(getCalendarMonthAction).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByText("다음 날 식사")).toBeInTheDocument();
    expect(screen.queryByText("점심")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith(null, "", "/calendar?month=2026-09&date=2026-09-15");
    expect(window.location.search).toBe("?month=2026-09&date=2026-09-15");
    replace.mockRestore();
  });

  it("월 이동에는 이전 선택 날짜를 전달하지 않는다", async () => {
    render(<CalendarHome {...props} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "다음 달" }));
    expect(mockPush).toHaveBeenCalledWith("/calendar?month=2026-10");
    await user.click(screen.getByRole("button", { name: "이전 달" }));
    expect(mockPush).toHaveBeenCalledWith("/calendar?month=2026-08");
  });

  it("연도 경계의 월 이동을 막고 연말에는 다음 연도로 이동한다", async () => {
    const view = render(<CalendarHome {...props} data={calendarMonth({ year: 2000, month: 1 })} initialDate="2000-01-01" />);
    expect(screen.getByRole("button", { name: "이전 달" })).toBeDisabled();
    view.rerender(<CalendarHome {...props} data={calendarMonth({ year: 2100, month: 12 })} initialDate="2100-12-01" />);
    expect(screen.getByRole("button", { name: "다음 달" })).toBeDisabled();
    view.rerender(<CalendarHome {...props} data={calendarMonth({ month: 12 })} initialDate="2026-12-01" />);
    await userEvent.setup().click(screen.getByRole("button", { name: "다음 달" }));
    expect(mockPush).toHaveBeenCalledWith("/calendar?month=2027-01");
  });

  it("빈 날의 추가 다이얼로그에 선택 날짜를 전달한다", async () => {
    render(<CalendarHome {...props} data={calendarMonth({ expenses: [], incomes: [] })} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "9월 30일" }));
    await user.click(screen.getByRole("button", { name: "이 날짜에 추가" }));
    expect(screen.getByRole("dialog", { name: "추가" })).toHaveTextContent("2026-09-30");
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each(["expense", "income"] as const)("선택 날짜의 %s 거래를 수정 다이얼로그에 전달한다", async (type) => {
    render(<CalendarHome {...props} />);
    const description = type === "expense" ? "점심" : "보너스";
    await userEvent.setup().click(screen.getByRole("button", { name: new RegExp(description) }));
    const dialog = screen.getByRole("dialog", { name: "수정" });
    expect(dialog).toHaveTextContent(`${type} ${type}-1`);
    expect(dialog).toHaveTextContent("family-1");
  });

  it("같은 월 갱신은 선택 날짜를 유지하고 새 거래와 합계를 표시한다", async () => {
    const view = render(<CalendarHome {...props} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "9월 15일" }));
    const latest = calendarMonth({
      expenses: [calendarExpense({ uuid: "new", description: "새 기록", date: "2026-09-15T10:00:00" })],
      incomes: [calendarIncome({ description: "새 수입", date: "2026-09-15T11:00:00" })],
      daily: { ...data.daily, dailyStats: [{ date: "2026-09-15", expense: 77700, income: 50000, memberExpenses: [{ userUuid: "wife", amount: 77700 }] }] },
    });
    view.rerender(<CalendarHome {...props} data={latest} />);
    expect(screen.getByText("9월 15일 (화)")).toBeInTheDocument();
    expect(screen.getByText("새 기록")).toBeInTheDocument();
    expect(screen.getByText("새 수입")).toBeInTheDocument();
    expect(screen.getByText("₩77,700")).toBeInTheDocument();
    expect(screen.queryByText("다음 날 식사")).not.toBeInTheDocument();
  });

  it("같은 월에서도 서버의 초기 날짜가 바뀌면 날짜 초안을 지우고 오늘로 돌아간다", async () => {
    const view = render(<CalendarHome {...props} initialDate="2026-09-13" />);
    await userEvent.setup().click(screen.getByRole("button", { name: "9월 15일" }));
    view.rerender(<CalendarHome {...props} />);

    expect(screen.getByText("9월 14일 (월)")).toBeInTheDocument();
    expect(screen.getByText("점심")).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get("date")).toBe(props.today);
  });

  it("오늘에서 다른 날을 고른 뒤 달력 탭으로 재진입하면 같은 초기 날짜여도 오늘로 돌아간다", async () => {
    const view = render(<CalendarHome {...props} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "9월 15일" }));
    expect(screen.getByText("다음 날 식사")).toBeInTheDocument();

    window.history.replaceState({}, "", "/calendar");
    view.rerender(<CalendarHome {...props} />);

    expect(screen.getByText("9월 14일 (월)")).toBeInTheDocument();
    expect(screen.getByText("점심")).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get("date")).toBe(props.today);
  });

  it("Next 내부 history 상태가 있어도 날짜 선택을 URL 구독에 반영하고 달력 탭 복귀를 감지한다", async () => {
    const originalReplace = window.history.replaceState.bind(window.history);
    originalReplace({ __NA: true }, "", "/calendar");
    let canonicalSearch = "";
    mockSearchParams.mockImplementation(() => new URLSearchParams(canonicalSearch));
    const replace = jest.spyOn(window.history, "replaceState").mockImplementation((state, unused, url) => {
      // Next의 내부 호출은 구독 갱신을 생략하고 외부 호출은 내부 상태를 복사한다.
      if (!state?.__NA && !state?._N && url) {
        canonicalSearch = new URL(String(url), window.location.href).search;
      }
      originalReplace({ ...state, __NA: true }, unused, url);
    });
    try {
      const view = render(<CalendarHome {...props} />);
      await userEvent.setup().click(screen.getByRole("button", { name: "9월 15일" }));
      view.rerender(<CalendarHome {...props} />);
      expect(new URLSearchParams(canonicalSearch).get("date")).toBe("2026-09-15");
      expect(window.history.state.__NA).toBe(true);

      canonicalSearch = "";
      originalReplace({ __NA: true }, "", "/calendar");
      view.rerender(<CalendarHome {...props} />);

      expect(screen.getByText("9월 14일 (월)")).toBeInTheDocument();
      expect(new URLSearchParams(canonicalSearch).get("date")).toBe(props.today);
    } finally {
      replace.mockRestore();
    }
  });

  it("월 또는 가족이 바뀌면 서버가 지정한 날짜를 선택한다", async () => {
    const view = render(<CalendarHome {...props} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "9월 15일" }));
    view.rerender(<CalendarHome {...props} data={calendarMonth({ month: 10 })} initialDate="2026-10-01" />);
    expect(screen.getByText("10월 1일 (목)")).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get("date")).toBe("2026-10-01");
    view.rerender(<CalendarHome {...props} familyUuid="family-2" initialDate="2026-09-01" />);
    expect(screen.getByText("9월 1일 (화)")).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get("date")).toBe("2026-09-01");
  });

  it("같은 월 갱신에서 수정 중인 거래도 최신 props를 사용한다", async () => {
    const view = render(<CalendarHome {...props} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /점심/ }));
    view.rerender(<CalendarHome {...props} data={calendarMonth({ expenses: [calendarExpense({ description: "수정된 점심" })] })} />);
    expect(screen.getByRole("dialog", { name: "수정" })).toHaveTextContent("수정된 점심");
    expect(mockEditLoadError).toHaveBeenCalledTimes(1);
    await userEvent.setup().click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("dialog", { name: "수정" })).not.toBeInTheDocument();
  });

  it("구성원 합계는 목록 금액 대신 서버 합계를 가입 순서로 표시한다", () => {
    render(<CalendarHome {...props} />);
    const totals = screen.getAllByRole("list")[0];
    expect(totals.textContent).toBe("아내₩33,000남편₩66,000");
    expect(screen.getByText("₩99,000")).toBeInTheDocument();
    expect(screen.getByText("₩120,000")).toBeInTheDocument();
  });
});
