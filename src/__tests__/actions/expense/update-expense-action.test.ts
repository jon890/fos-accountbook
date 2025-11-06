/**
 * Update Expense Action 테스트
 *
 * 테스트 범위:
 * - Zod 검증
 * - 성공/실패 플로우
 * - API 통신 모킹
 * - 에러 처리
 */

import { updateExpenseAction } from "@/app/actions/expense/update-expense-action";

// Mock modules
jest.mock("@/lib/server/auth-helpers", () => ({
  requireAuth: jest.fn().mockResolvedValue({ user: { id: "test-user" } }),
}));

jest.mock("@/lib/server/api/client", () => ({
  serverApiClient: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import { serverApiClient } from "@/lib/server/api/client";
import { revalidatePath } from "next/cache";

const mockedServerApiClient = serverApiClient as jest.MockedFunction<
  typeof serverApiClient
>;
const mockedRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

describe("updateExpenseAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    mockedServerApiClient.mockResolvedValueOnce({
      data: { uuid: "test-uuid", amount: 50000 },
    });

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
      expect.objectContaining({
        method: "PUT",
      })
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/expenses");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/");
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
    mockedServerApiClient.mockResolvedValueOnce({
      data: { uuid: "test-uuid" },
    });

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
    mockedServerApiClient.mockResolvedValueOnce({
      data: { uuid: "test-uuid" },
    });

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
    const callArg = mockedServerApiClient.mock.calls[0][1];
    const body = JSON.parse(callArg?.body as string);
    expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
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
});
