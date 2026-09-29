/**
 * getRecurringExpensesTotalAction 테스트
 * @jest-environment node
 */

jest.mock("@/lib/env/server.env", () => ({
  serverEnv: {
    BACKEND_API_URL: "http://localhost:8080",
  },
}));
jest.mock("@/lib/server/auth/auth", () => ({
  handlers: {},
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock("@/lib/server/auth/auth-helpers");
jest.mock("@/services/recurring-expense/recurring-expense-service");
jest.mock("next/cache");

import { getRecurringExpensesTotalAction } from "@/actions/recurring-expense";
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { getRecurringExpensesMonthlyTotal } from "@/services/recurring-expense/recurring-expense-service";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockGetSelectedFamilyUuid = getSelectedFamilyUuid as jest.MockedFunction<
  typeof getSelectedFamilyUuid
>;
const mockGetRecurringExpensesMonthlyTotal =
  getRecurringExpensesMonthlyTotal as jest.MockedFunction<
    typeof getRecurringExpensesMonthlyTotal
  >;

describe("getRecurringExpensesTotalAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue(undefined as unknown as Awaited<ReturnType<typeof requireAuth>>);
    mockGetSelectedFamilyUuid.mockResolvedValue("family-1");
  });

  it("정상 합계 조회 시 성공 반환", async () => {
    mockGetRecurringExpensesMonthlyTotal.mockResolvedValue(72000);

    const result = await getRecurringExpensesTotalAction();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(72000);
    }
    expect(mockGetRecurringExpensesMonthlyTotal).toHaveBeenCalledWith(
      "family-1"
    );
  });

  it("미인증 시 requireAuth 에러", async () => {
    mockRequireAuth.mockRejectedValue(new Error("Unauthorized"));

    const result = await getRecurringExpensesTotalAction();

    expect(result.success).toBe(false);
    expect(mockGetRecurringExpensesMonthlyTotal).not.toHaveBeenCalled();
  });

  it("familyUuid 미선택 시 실패", async () => {
    mockGetSelectedFamilyUuid.mockResolvedValue(null);

    const result = await getRecurringExpensesTotalAction();

    expect(result.success).toBe(false);
    expect(mockGetRecurringExpensesMonthlyTotal).not.toHaveBeenCalled();
  });

  it("서비스 에러 시 handleActionError 처리", async () => {
    mockGetRecurringExpensesMonthlyTotal.mockRejectedValue(
      new Error("Service Error")
    );

    const result = await getRecurringExpensesTotalAction();

    expect(result.success).toBe(false);
    expect(mockGetRecurringExpensesMonthlyTotal).toHaveBeenCalled();
  });
});
