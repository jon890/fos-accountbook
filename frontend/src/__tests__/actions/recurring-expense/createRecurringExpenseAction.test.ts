/**
 * createRecurringExpenseAction 테스트
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

import { createRecurringExpenseAction } from "@/actions/recurring-expense";
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { createRecurringExpense } from "@/services/recurring-expense/recurring-expense-service";
import { revalidatePath } from "next/cache";
import type { RecurringExpense } from "@/types/recurring-expense";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockGetSelectedFamilyUuid = getSelectedFamilyUuid as jest.MockedFunction<
  typeof getSelectedFamilyUuid
>;
const mockCreateRecurringExpense =
  createRecurringExpense as jest.MockedFunction<typeof createRecurringExpense>;
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

describe("createRecurringExpenseAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue(
      undefined as unknown as Awaited<ReturnType<typeof requireAuth>>
    );
    mockGetSelectedFamilyUuid.mockResolvedValue("family-1");
  });

  it("유효한 입력으로 등록 성공", async () => {
    mockCreateRecurringExpense.mockResolvedValue(mockRecurringExpense);

    const result = await createRecurringExpenseAction({
      name: "넷플릭스",
      categoryUuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      amount: 17000,
      dayOfMonth: 15,
    });

    expect(result.success).toBe(true);
    expect(mockCreateRecurringExpense).toHaveBeenCalledWith("family-1", {
      name: "넷플릭스",
      categoryUuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      amount: 17000,
      dayOfMonth: 15,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/transactions");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("dayOfMonth 29 이상이면 Zod 검증 실패", async () => {
    const result = await createRecurringExpenseAction({
      name: "넷플릭스",
      categoryUuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      amount: 17000,
      dayOfMonth: 29,
    });

    expect(result.success).toBe(false);
    expect(mockCreateRecurringExpense).not.toHaveBeenCalled();
  });

  it("금액 0 이하이면 Zod 검증 실패", async () => {
    const result = await createRecurringExpenseAction({
      name: "넷플릭스",
      categoryUuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      amount: 0,
      dayOfMonth: 15,
    });

    expect(result.success).toBe(false);
    expect(mockCreateRecurringExpense).not.toHaveBeenCalled();
  });

  it("미인증 시 requireAuth 에러", async () => {
    mockRequireAuth.mockRejectedValue(new Error("Unauthorized"));

    const result = await createRecurringExpenseAction({
      name: "넷플릭스",
      categoryUuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      amount: 17000,
      dayOfMonth: 15,
    });

    expect(result.success).toBe(false);
    expect(mockRequireAuth).toHaveBeenCalled();
    expect(mockCreateRecurringExpense).not.toHaveBeenCalled();
  });

  it("familyUuid 미선택 시 실패", async () => {
    mockGetSelectedFamilyUuid.mockResolvedValue(null);

    const result = await createRecurringExpenseAction({
      name: "넷플릭스",
      categoryUuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      amount: 17000,
      dayOfMonth: 15,
    });

    expect(result.success).toBe(false);
    expect(mockCreateRecurringExpense).not.toHaveBeenCalled();
  });

  it("서비스 호출 실패 시 에러 반환", async () => {
    mockCreateRecurringExpense.mockRejectedValue(new Error("Service Error"));

    const result = await createRecurringExpenseAction({
      name: "넷플릭스",
      categoryUuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      amount: 17000,
      dayOfMonth: 15,
    });

    expect(result.success).toBe(false);
    expect(mockCreateRecurringExpense).toHaveBeenCalled();
  });
});
