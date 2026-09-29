/**
 * Update Expense Action 테스트
 * @jest-environment node
 *
 * 테스트 범위:
 * - Zod 검증
 * - 성공/실패 플로우
 * - API 통신 모킹
 * - 에러 처리
 * - familyUuid 소유권 검증
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
jest.mock("@/lib/server/api/client");
jest.mock("next/cache");

import { updateExpenseAction } from "@/actions/expense/update-expense-action";
import { serverApiPut } from "@/lib/server/api/client";
import { requireAuth, getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockGetSelectedFamilyUuid = getSelectedFamilyUuid as jest.MockedFunction<
  typeof getSelectedFamilyUuid
>;
const mockedServerApiClient = serverApiPut as jest.MockedFunction<
  typeof serverApiPut
>;
const mockedRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

const mockSession: Session = {
  user: { userUuid: "user-1" },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

describe("updateExpenseAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue(mockSession);
    mockGetSelectedFamilyUuid.mockResolvedValue("family-uuid");
  });

  const createFormData = (data: Record<string, string>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return formData;
  };

  it("유효한 데이터로 지출 수정에 성공한다", async () => {
    // Given
    mockedServerApiClient.mockResolvedValueOnce(undefined);

    const formData = createFormData({
      expenseUuid: "test-uuid",
      familyUuid: "family-uuid",
      amount: "50000",
      categoryId: "category-uuid",
      description: "수정된 설명",
      date: "2025-01-15",
    });

    const initialState = { success: false, message: "", errors: {} };

    // When
    const result = await updateExpenseAction(initialState, formData);

    // Then
    expect(result.success).toBe(true);
    expect(result.message).toBe("지출이 수정되었습니다");
    expect(mockedServerApiClient).toHaveBeenCalledWith(
      "/families/family-uuid/expenses/test-uuid",
      expect.any(Object)
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/transactions");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/analytics");
  });

  it("필수 필드(expenseUuid)가 없으면 에러를 반환한다", async () => {
    // Given
    const formData = createFormData({
      familyUuid: "family-uuid",
      amount: "50000",
    });

    const initialState = { success: false, message: "", errors: {} };

    // When
    const result = await updateExpenseAction(initialState, formData);

    // Then
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it("금액이 0보다 작으면 에러를 반환한다", async () => {
    // Given
    const formData = createFormData({
      expenseUuid: "test-uuid",
      familyUuid: "family-uuid",
      amount: "-1000",
    });

    const initialState = { success: false, message: "", errors: {} };

    // When
    const result = await updateExpenseAction(initialState, formData);

    // Then
    expect(result.success).toBe(false);
    expect(result.errors?.amount).toBeDefined();
  });

  it("금액만 수정해도 성공한다", async () => {
    // Given
    mockedServerApiClient.mockResolvedValueOnce(undefined);

    const formData = createFormData({
      expenseUuid: "test-uuid",
      familyUuid: "family-uuid",
      amount: "30000",
    });

    const initialState = { success: false, message: "", errors: {} };

    // When
    const result = await updateExpenseAction(initialState, formData);

    // Then
    expect(result.success).toBe(true);
  });

  it("API 호출 실패 시 에러 메시지를 반환한다", async () => {
    // Given
    mockedServerApiClient.mockRejectedValueOnce(new Error("Network error"));

    const formData = createFormData({
      expenseUuid: "test-uuid",
      familyUuid: "family-uuid",
      amount: "50000",
    });

    const initialState = { success: false, message: "", errors: {} };

    // When
    const result = await updateExpenseAction(initialState, formData);

    // Then
    expect(result.success).toBe(false);
    expect(result.message).toContain("오류");
  });

  it("날짜 형식을 ISO 8601로 변환한다", async () => {
    // Given
    mockedServerApiClient.mockResolvedValueOnce(undefined);

    const formData = createFormData({
      expenseUuid: "test-uuid",
      familyUuid: "family-uuid",
      amount: "50000",
      date: "2025-01-15",
    });

    const initialState = { success: false, message: "", errors: {} };

    // When
    await updateExpenseAction(initialState, formData);

    // Then
    const callArg = mockedServerApiClient.mock.calls[0][1] as Record<string, unknown>;
    expect(callArg?.date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("아무것도 수정하지 않으면 에러를 반환한다", async () => {
    // Given
    const formData = createFormData({
      expenseUuid: "test-uuid",
      familyUuid: "family-uuid",
    });

    const initialState = { success: false, message: "", errors: {} };

    // When
    const result = await updateExpenseAction(initialState, formData);

    // Then
    expect(result.success).toBe(false);
    expect(result.message).toBe("수정할 내용이 없습니다");
  });

  it("familyUuid가 세션과 다르면 권한 에러를 반환한다", async () => {
    // Given
    const formData = createFormData({
      expenseUuid: "test-uuid",
      familyUuid: "attacker-family-uuid",
      amount: "50000",
    });

    const initialState = { success: false, message: "", errors: {} };

    // When
    const result = await updateExpenseAction(initialState, formData);

    // Then
    expect(result.success).toBe(false);
    expect(result.message).toBe("권한이 없습니다.");
  });

  it("세션에 가족 정보가 없으면 에러를 반환한다", async () => {
    // Given
    mockGetSelectedFamilyUuid.mockResolvedValueOnce(null);

    const formData = createFormData({
      expenseUuid: "test-uuid",
      familyUuid: "family-uuid",
      amount: "50000",
    });

    const initialState = { success: false, message: "", errors: {} };

    // When
    const result = await updateExpenseAction(initialState, formData);

    // Then
    expect(result.success).toBe(false);
    expect(result.message).toBe("가족 정보를 찾을 수 없습니다.");
  });
});
