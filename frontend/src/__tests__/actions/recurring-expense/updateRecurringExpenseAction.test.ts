/**
 * updateRecurringExpenseAction 테스트
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

import { updateRecurringExpenseAction } from "@/actions/recurring-expense";
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { updateRecurringExpense } from "@/services/recurring-expense/recurring-expense-service";
import { revalidatePath } from "next/cache";
import type { RecurringExpense } from "@/types/recurring-expense";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockGetSelectedFamilyUuid = getSelectedFamilyUuid as jest.MockedFunction<
  typeof getSelectedFamilyUuid
>;
const mockUpdateRecurringExpense =
  updateRecurringExpense as jest.MockedFunction<typeof updateRecurringExpense>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

const mockRecurringExpense: RecurringExpense = {
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
};

describe("updateRecurringExpenseAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue(undefined as unknown as Awaited<ReturnType<typeof requireAuth>>);
    mockGetSelectedFamilyUuid.mockResolvedValue("family-1");
  });

  it("유효한 uuid + partial data로 수정 성공", async () => {
    mockUpdateRecurringExpense.mockResolvedValue(mockRecurringExpense);

    const result = await updateRecurringExpenseAction("recurring-1", {
      name: "유튜브 프리미엄",
      amount: 14900,
    });

    expect(result.success).toBe(true);
    expect(mockUpdateRecurringExpense).toHaveBeenCalledWith(
      "family-1",
      "recurring-1",
      { name: "유튜브 프리미엄", amount: 14900 }
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/transactions");
  });

  it("uuid 빈 값이면 실패, service 미호출", async () => {
    const result = await updateRecurringExpenseAction("", {
      name: "유튜브 프리미엄",
    });

    expect(result.success).toBe(false);
    expect(mockUpdateRecurringExpense).not.toHaveBeenCalled();
  });

  it("dayOfMonth만 전달해도 partial schema 통과", async () => {
    mockUpdateRecurringExpense.mockResolvedValue(mockRecurringExpense);

    const result = await updateRecurringExpenseAction("recurring-1", {
      dayOfMonth: 10,
    });

    expect(result.success).toBe(true);
    expect(mockUpdateRecurringExpense).toHaveBeenCalledWith(
      "family-1",
      "recurring-1",
      { dayOfMonth: 10 }
    );
  });

  it("dayOfMonth 29이면 Zod 검증 실패", async () => {
    const result = await updateRecurringExpenseAction("recurring-1", {
      dayOfMonth: 29,
    });

    expect(result.success).toBe(false);
    expect(mockUpdateRecurringExpense).not.toHaveBeenCalled();
  });

  it("미인증 시 requireAuth 에러", async () => {
    mockRequireAuth.mockRejectedValue(new Error("Unauthorized"));

    const result = await updateRecurringExpenseAction("recurring-1", {
      name: "유튜브 프리미엄",
    });

    expect(result.success).toBe(false);
    expect(mockRequireAuth).toHaveBeenCalled();
    expect(mockUpdateRecurringExpense).not.toHaveBeenCalled();
  });

  it("familyUuid 미선택 시 실패", async () => {
    mockGetSelectedFamilyUuid.mockResolvedValue(null);

    const result = await updateRecurringExpenseAction("recurring-1", {
      name: "유튜브 프리미엄",
    });

    expect(result.success).toBe(false);
    expect(mockUpdateRecurringExpense).not.toHaveBeenCalled();
  });
});
