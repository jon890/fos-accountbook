/**
 * deleteExpenseAction 테스트
 * @jest-environment node
 */

// Mock modules - import 전에 선언해야 함
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

import { deleteExpenseAction } from "@/app/actions/expense/delete-expense-action";
import { ActionError } from "@/lib/errors";
import { serverApiClient } from "@/lib/server/api/client";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import type { Session } from "next-auth";
import { revalidatePath } from "next/cache";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockServerApiClient = serverApiClient as jest.MockedFunction<
  typeof serverApiClient
>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

// Mock Session 데이터
const mockSession: Session = {
  user: {
    userUuid: "user-1",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

describe("deleteExpenseAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue(mockSession);
  });

  it("유효한 파라미터로 지출 삭제에 성공한다", async () => {
    // Given
    mockServerApiClient.mockResolvedValue({});

    // When
    const result = await deleteExpenseAction("family-1", "expense-1");

    // Then
    expect(result.success).toBe(true);
    expect(mockServerApiClient).toHaveBeenCalledWith(
      "/families/family-1/expenses/expense-1",
      expect.objectContaining({
        method: "DELETE",
      })
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/transactions");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("familyUuid가 없으면 에러를 반환한다", async () => {
    // Given & When
    const result = await deleteExpenseAction("", "expense-1");

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error?.message).toContain("가족");
    }
    expect(mockServerApiClient).not.toHaveBeenCalled();
  });

  it("expenseUuid가 없으면 에러를 반환한다", async () => {
    // Given & When
    const result = await deleteExpenseAction("family-1", "");

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error?.message).toContain("필수");
    }
    expect(mockServerApiClient).not.toHaveBeenCalled();
  });

  it("인증 실패 시 에러를 반환한다", async () => {
    // Given
    mockRequireAuth.mockRejectedValue(ActionError.unauthorized());

    // When
    const result = await deleteExpenseAction("family-1", "expense-1");

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
    expect(mockServerApiClient).not.toHaveBeenCalled();
  });

  it("API 호출 실패 시 에러를 반환한다", async () => {
    // Given
    mockServerApiClient.mockRejectedValue(new Error("Network error"));

    // When
    const result = await deleteExpenseAction("family-1", "expense-1");

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error?.message).toContain("실패");
    }
  });

  it("삭제 성공 시 페이지를 재검증한다", async () => {
    // Given
    mockServerApiClient.mockResolvedValue({});

    // When
    await deleteExpenseAction("family-1", "expense-1");

    // Then
    expect(mockRevalidatePath).toHaveBeenCalledTimes(2);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/transactions");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });
});
