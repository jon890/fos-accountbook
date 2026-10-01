/** @jest-environment node */
import { getMonthlyDailyStatsAction } from "@/actions/dashboard/get-monthly-daily-stats-action";
import { requireAuth, getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { serverApiGet } from "@/lib/server/api/client";
import { ServerApiError } from "@/lib/server/api/types";
import { ActionError, ErrorCode } from "@/lib/errors";

jest.mock("@/lib/server/auth/auth-helpers", () => ({
  requireAuth: jest.fn(),
  getSelectedFamilyUuid: jest.fn(),
}));
jest.mock("@/lib/server/api/client", () => ({ serverApiGet: jest.fn() }));
jest.mock("@/lib/server/cache", () => ({
  getCachedDashboardStats: jest.fn(),
  getCachedFamilyCategories: jest.fn(),
}));

beforeEach(() => {
  jest.resetAllMocks();
  (requireAuth as jest.Mock).mockResolvedValue({ user: { id: "user" } });
  jest.mocked(getSelectedFamilyUuid).mockResolvedValue("family");
});

it("실제 서비스의 일별 집계 결과를 성공 데이터로 반환한다", async () => {
  const dailyStats = [{ date: "2026-10-01", income: 20000, expense: 3000 }];
  jest.mocked(serverApiGet).mockResolvedValue({ dailyStats });

  expect(await getMonthlyDailyStatsAction(2026, 10)).toEqual({ success: true, data: dailyStats });
  expect(serverApiGet).toHaveBeenCalledWith(
    "/families/family/dashboard/daily-stats?year=2026&month=10",
  );
});

it("거래가 없는 달은 빈 배열인 성공 응답이다", async () => {
  jest.mocked(serverApiGet).mockResolvedValue({ dailyStats: [] });

  expect(await getMonthlyDailyStatsAction(2026, 10)).toEqual({ success: true, data: [] });
});

it.each([new ServerApiError("집계 실패", 500), new Error("집계 연결 실패")])(
  "실제 서비스의 일반 실패를 실패 응답으로 반환한다: %s",
  async (error) => {
    jest.mocked(serverApiGet).mockRejectedValue(error);

    expect(await getMonthlyDailyStatsAction(2026, 10)).toMatchObject({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: "월별 일일 통계 조회에 실패했습니다",
        debugInfo: { cause: error.message, causeType: error.name },
      },
    });
  },
);

it("실제 서비스의 401 실패를 인증 만료로 반환한다", async () => {
  jest.mocked(serverApiGet).mockRejectedValue(new ServerApiError("만료", 401));

  expect(await getMonthlyDailyStatsAction(2026, 10)).toMatchObject({
    success: false,
    error: { code: "A002", message: "세션이 만료되었습니다" },
  });
});

it("유효하지 않은 월은 API를 호출하지 않고 실패한다", async () => {
  expect(await getMonthlyDailyStatsAction(2026, 13)).toMatchObject({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: "월별 일일 통계 조회에 실패했습니다",
    },
  });
  expect(serverApiGet).not.toHaveBeenCalled();
});

it("미인증 상태에서는 API를 호출하지 않는다", async () => {
  jest.mocked(requireAuth).mockRejectedValue(ActionError.unauthorized());

  expect(await getMonthlyDailyStatsAction(2026, 10)).toMatchObject({
    success: false,
    error: { code: "A001" },
  });
  expect(serverApiGet).not.toHaveBeenCalled();
});

it("가족을 선택하지 않았으면 가족 미선택 오류를 반환한다", async () => {
  jest.mocked(getSelectedFamilyUuid).mockResolvedValue(null);

  expect(await getMonthlyDailyStatsAction(2026, 10)).toMatchObject({
    success: false,
    error: { code: "F002" },
  });
  expect(serverApiGet).not.toHaveBeenCalled();
});
