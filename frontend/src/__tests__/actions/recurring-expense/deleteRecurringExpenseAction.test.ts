/**
 * deleteRecurringExpenseAction 테스트
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

import { deleteRecurringExpenseAction } from "@/actions/recurring-expense";
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { deleteRecurringExpense } from "@/services/recurring-expense/recurring-expense-service";
import { revalidatePath } from "next/cache";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockGetSelectedFamilyUuid = getSelectedFamilyUuid as jest.MockedFunction<
  typeof getSelectedFamilyUuid
>;
const mockDeleteRecurringExpense =
  deleteRecurringExpense as jest.MockedFunction<typeof deleteRecurringExpense>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

describe("deleteRecurringExpenseAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue(undefined as unknown as Awaited<ReturnType<typeof requireAuth>>);
    mockGetSelectedFamilyUuid.mockResolvedValue("family-1");
  });

  it("유효한 uuid로 삭제 성공", async () => {
    mockDeleteRecurringExpense.mockResolvedValue(undefined);

    const result = await deleteRecurringExpenseAction("recurring-1");

    expect(result.success).toBe(true);
    expect(mockDeleteRecurringExpense).toHaveBeenCalledWith(
      "family-1",
      "recurring-1"
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/transactions");
  });

  it("uuid 빈 값이면 실패, service 미호출", async () => {
    const result = await deleteRecurringExpenseAction("");

    expect(result.success).toBe(false);
    expect(mockDeleteRecurringExpense).not.toHaveBeenCalled();
  });

  it("미인증 시 requireAuth 에러", async () => {
    mockRequireAuth.mockRejectedValue(new Error("Unauthorized"));

    const result = await deleteRecurringExpenseAction("recurring-1");

    expect(result.success).toBe(false);
    expect(mockRequireAuth).toHaveBeenCalled();
    expect(mockDeleteRecurringExpense).not.toHaveBeenCalled();
  });

  it("familyUuid 미선택 시 실패", async () => {
    mockGetSelectedFamilyUuid.mockResolvedValue(null);

    const result = await deleteRecurringExpenseAction("recurring-1");

    expect(result.success).toBe(false);
    expect(mockDeleteRecurringExpense).not.toHaveBeenCalled();
  });

  it("서비스 호출 실패 시 에러 반환", async () => {
    mockDeleteRecurringExpense.mockRejectedValue(new Error("Service Error"));

    const result = await deleteRecurringExpenseAction("recurring-1");

    expect(result.success).toBe(false);
    expect(mockDeleteRecurringExpense).toHaveBeenCalled();
  });
});
