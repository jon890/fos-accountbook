import { render, screen } from "@testing-library/react";
import CalendarPage from "@/app/(authenticated)/calendar/page";
import { getCalendarMonthAction } from "@/actions/calendar/get-calendar-month-action";
import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { calendarMonth } from "@/test-fixtures/calendar";
import type { Session } from "next-auth";

jest.mock("@/actions/calendar/get-calendar-month-action", () => ({ getCalendarMonthAction: jest.fn() }));
jest.mock("@/lib/server/auth", () => ({ auth: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn((url: string) => { throw new Error(`redirect:${url}`); }) }));
jest.mock("@/components/calendar/CalendarHome", () => ({
  CalendarHome: ({ data, initialDate, today, familyUuid }: { data: { year: number; month: number }; initialDate: string; today: string; familyUuid: string }) => <div>{data.year}-{data.month} {initialDate} 오늘:{today} 가족:{familyUuid}</div>,
}));

const mockAuth = auth as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-09-30T16:00:00Z"));
  mockAuth.mockResolvedValue({ user: { userUuid: "user", profile: { defaultFamilyUuid: "family-1", timezone: "Asia/Seoul" } } } as Session);
  jest.mocked(getCalendarMonthAction).mockImplementation(async (year, month) => ({ success: true, data: calendarMonth({ year, month }) }));
});

afterEach(() => jest.useRealTimers());

async function renderPage(params: { month?: string | string[]; date?: string | string[] } = {}) {
  render(await CalendarPage({ searchParams: Promise.resolve(params) }));
}

describe("달력 Page", () => {
  it("최초 조회는 사용자 시간대의 현재 월과 오늘을 사용하고 빈 월에도 가족을 전달한다", async () => {
    jest.mocked(getCalendarMonthAction).mockResolvedValue({ success: true, data: calendarMonth({ year: 2026, month: 10, expenses: [], incomes: [] }) });
    await renderPage();
    expect(getCalendarMonthAction).toHaveBeenCalledWith(2026, 10);
    expect(screen.getByText(/2026-10-01/)).toHaveTextContent("가족:family-1");
  });

  it("뉴욕 시간대에서는 아직 9월 30일이다", async () => {
    mockAuth.mockResolvedValue({ user: { profile: { defaultFamilyUuid: "family-1", timezone: "America/New_York" } } });
    await renderPage();
    expect(getCalendarMonthAction).toHaveBeenCalledWith(2026, 9);
    expect(screen.getByText(/2026-09-30/)).toBeInTheDocument();
  });

  it.each(["2026-9", "bad", "1999-12", "2101-01", "2026-00", "2026-13"])("잘못된 월 %s는 현재 월을 쓴다", async (month) => {
    await renderPage({ month });
    expect(getCalendarMonthAction).toHaveBeenCalledWith(2026, 10);
    expect(screen.getByText(/2026-10-01/)).toBeInTheDocument();
  });

  it.each(["2026-09-31", "2026-09-00", "2026-9-14", "2026-10-01", "2025-09-14", "bad"])("잘못된 날짜 %s는 요청 월의 1일을 쓴다", async (date) => {
    await renderPage({ month: "2026-09", date });
    expect(getCalendarMonthAction).toHaveBeenCalledWith(2026, 9);
    expect(screen.getByText(/2026-09-01/)).toBeInTheDocument();
  });

  it("오늘이 조회 월에 속하면 잘못된 날짜의 기본값도 오늘이다", async () => {
    jest.setSystemTime(new Date("2026-10-14T00:00:00Z"));
    await renderPage({ month: "2026-10", date: "2026-09-14" });
    expect(screen.getByText(/2026-10-14/)).toBeInTheDocument();
  });

  it.each([
    ["2000-01", "2000-01-31", 2000, 1],
    ["2100-12", "2100-12-31", 2100, 12],
    ["2024-02", "2024-02-29", 2024, 2],
  ])("유효한 경계 월 %s와 실제 날짜 %s를 유지한다", async (month, date, year, numericMonth) => {
    await renderPage({ month: String(month), date: String(date) });
    expect(getCalendarMonthAction).toHaveBeenCalledWith(year, numericMonth);
    expect(screen.getByText(new RegExp(String(date)))).toBeInTheDocument();
  });

  it("평년 2월 29일은 존재하지 않아 1일로 처리한다", async () => {
    await renderPage({ month: "2100-02", date: "2100-02-29" });
    expect(screen.getByText(/2100-02-01/)).toBeInTheDocument();
  });

  it("중복된 월과 날짜 쿼리는 기본값으로 처리한다", async () => {
    await renderPage({ month: ["2026-09", "2026-10"], date: ["2026-09-14", "2026-10-01"] });
    expect(getCalendarMonthAction).toHaveBeenCalledWith(2026, 10);
    expect(screen.getByText(/2026-10-01/)).toBeInTheDocument();
  });

  it.each(["C004", "C001", "C003"] as const)("일반 오류 %s는 로그인 이동 없이 error boundary로 던진다", async (code) => {
    jest.mocked(getCalendarMonthAction).mockResolvedValue({ success: false, error: { code, message: "조회 실패" } });
    await expect(CalendarPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("조회 실패");
    expect(redirect).not.toHaveBeenCalled();
  });

  it.each(["F001", "F003"] as const)("기본 가족 오류 %s는 가족 선택으로 이동한다", async (code) => {
    jest.mocked(getCalendarMonthAction).mockResolvedValue({ success: false, error: { code, message: "유효하지 않은 가족" } });
    await expect(CalendarPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/families/select");
    expect(redirect).toHaveBeenCalledWith("/families/select");
  });

  it.each(["A001", "A002"] as const)("인증 오류 %s는 기존 로그인 오류 처리로 이동한다", async (code) => {
    jest.mocked(getCalendarMonthAction).mockResolvedValue({ success: false, error: { code, message: "세션 만료" } });
    await expect(CalendarPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/auth/signin?error=auth");
    expect(redirect).toHaveBeenCalledWith(`/auth/signin?error=auth&message=${encodeURIComponent("세션 만료")}`);
  });

  it("세션이 없으면 로그인으로 이동한다", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(CalendarPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/auth/signin");
    expect(getCalendarMonthAction).not.toHaveBeenCalled();
  });

  it("가족이 없으면 가족 생성으로 이동한다", async () => {
    mockAuth.mockResolvedValue({ user: { profile: {} } });
    await expect(CalendarPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/families/create");
  });
});
