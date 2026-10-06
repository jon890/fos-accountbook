/** @jest-environment node */
jest.mock("@/lib/server/auth/auth-helpers", () => ({ requireAuth: jest.fn(), getSelectedFamilyUuid: jest.fn() }));
jest.mock("@/services/calendar/calendar-service", () => ({ getCalendarMonth: jest.fn() }));

import { getCalendarMonthAction } from "@/actions/calendar/get-calendar-month-action";
import { requireAuth, getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { ServerApiError } from "@/lib/server/api/types";
import { ActionError, ErrorCode } from "@/lib/errors";
import { getCalendarMonth } from "@/services/calendar/calendar-service";
import type { CalendarMonth } from "@/types/calendar";

const data: CalendarMonth = {
  year: 2026, month: 1,
  daily: { year: 2026, month: 1, dailyStats: [], totalIncome: 0, totalExpense: 0 },
  expenses: [], incomes: [], members: [],
  budgetSummary: { year: 2026, month: 1, total: { spent: 0, limit: 0 }, living: { spent: 0, limit: 0 }, allocationExceeded: false, items: [] },
};

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(getSelectedFamilyUuid).mockResolvedValue("family-1");
  jest.mocked(getCalendarMonth).mockResolvedValue(data);
});

describe("달력 Action", () => {
  it.each([
    [403, ErrorCode.NOT_FAMILY_MEMBER],
    [404, ErrorCode.FAMILY_NOT_FOUND],
    [500, ErrorCode.INTERNAL_ERROR],
  ])("백엔드 %s를 %s로 변환한다", async (status, code) => {
    jest.mocked(getCalendarMonth).mockRejectedValue(new ServerApiError("조회 실패", Number(status)));
    expect(await getCalendarMonthAction(2026, 1)).toMatchObject({ success: false, error: { code } });
  });
  it("선택 가족의 월 응답을 반환한다", async () => {
    expect(await getCalendarMonthAction(2026, 1)).toEqual({ success: true, data });
    expect(getCalendarMonth).toHaveBeenCalledWith("family-1", 2026, 1);
  });

  it.each([[2026, 0], [2026, 13], [1999, 1], [2101, 1], [2026, 1.5]])("잘못된 연월 %s/%s를 거부한다", async (year, month) => {
    expect((await getCalendarMonthAction(year, month)).success).toBe(false);
    expect(getCalendarMonth).not.toHaveBeenCalled();
  });

  it.each([[2000, 1], [2100, 12]])("허용 경계 %s/%s를 조회한다", async (year, month) => {
    expect((await getCalendarMonthAction(year, month)).success).toBe(true);
    expect(getCalendarMonth).toHaveBeenCalledWith("family-1", year, month);
  });

  it("가족 미선택을 오류로 반환한다", async () => {
    jest.mocked(getSelectedFamilyUuid).mockResolvedValue(null);
    expect(await getCalendarMonthAction(2026, 1)).toMatchObject({ success: false, error: { code: ErrorCode.FAMILY_NOT_SELECTED } });
    expect(getCalendarMonth).not.toHaveBeenCalled();
  });

  it("백엔드 401을 인증 만료로 변환한다", async () => {
    jest.mocked(getCalendarMonth).mockRejectedValue(new ServerApiError("인증 실패", 401));
    expect(await getCalendarMonthAction(2026, 1)).toMatchObject({ success: false, error: { code: ErrorCode.SESSION_EXPIRED } });
  });

  it("인증 실패 시 서비스를 호출하지 않는다", async () => {
    jest.mocked(requireAuth).mockRejectedValue(ActionError.unauthorized());
    expect(await getCalendarMonthAction(2026, 1)).toMatchObject({
      success: false,
      error: { code: ErrorCode.UNAUTHORIZED },
    });
    expect(getCalendarMonth).not.toHaveBeenCalled();
  });
});
