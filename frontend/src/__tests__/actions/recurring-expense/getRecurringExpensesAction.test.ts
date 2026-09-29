/**
 * getRecurringExpensesAction 테스트
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

import { getRecurringExpensesAction } from "@/actions/recurring-expense";
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { getRecurringExpenses } from "@/services/recurring-expense/recurring-expense-service";
import type { GetRecurringExpensesResponse } from "@/types/recurring-expense";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockGetSelectedFamilyUuid = getSelectedFamilyUuid as jest.MockedFunction<
  typeof getSelectedFamilyUuid
>;
const mockGetRecurringExpenses = getRecurringExpenses as jest.MockedFunction<
  typeof getRecurringExpenses
>;

const mockResponse: GetRecurringExpensesResponse = {
  totalMonthlyAmount: 34000,
  items: [
    {
      uuid: "recurring-1",
      familyUuid: "family-1",
      categoryUuid: "category-1",
      category: {
        uuid: "category-1",
        familyUuid: "family-1",
        name: "식비",
        icon: "🍔",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      name: "넷플릭스",
      amount: 17000,
      dayOfMonth: 15,
      status: "ACTIVE",
      generatedThisMonth: false,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ],
};

describe("getRecurringExpensesAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue(undefined as unknown as Awaited<ReturnType<typeof requireAuth>>);
    mockGetSelectedFamilyUuid.mockResolvedValue("family-1");
  });

  it("정상 조회 시 service 호출 후 성공 반환", async () => {
    mockGetRecurringExpenses.mockResolvedValue(mockResponse);

    const result = await getRecurringExpensesAction();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockResponse);
    }
    expect(mockGetRecurringExpenses).toHaveBeenCalledWith(
      "family-1",
      undefined
    );
  });

  it("month 파라미터 전달 시 service에 그대로 전달", async () => {
    mockGetRecurringExpenses.mockResolvedValue(mockResponse);

    const result = await getRecurringExpensesAction("2026-04");

    expect(result.success).toBe(true);
    expect(mockGetRecurringExpenses).toHaveBeenCalledWith(
      "family-1",
      "2026-04"
    );
  });

  it("month 미전달 시 service에 undefined 전달", async () => {
    mockGetRecurringExpenses.mockResolvedValue(mockResponse);

    await getRecurringExpensesAction();

    expect(mockGetRecurringExpenses).toHaveBeenCalledWith(
      "family-1",
      undefined
    );
  });

  it("미인증 시 requireAuth 에러", async () => {
    mockRequireAuth.mockRejectedValue(new Error("Unauthorized"));

    const result = await getRecurringExpensesAction();

    expect(result.success).toBe(false);
    expect(mockGetRecurringExpenses).not.toHaveBeenCalled();
  });

  it("familyUuid 미선택 시 실패", async () => {
    mockGetSelectedFamilyUuid.mockResolvedValue(null);

    const result = await getRecurringExpensesAction();

    expect(result.success).toBe(false);
    expect(mockGetRecurringExpenses).not.toHaveBeenCalled();
  });
});
