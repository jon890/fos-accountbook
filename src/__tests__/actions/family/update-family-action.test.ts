/**
 * updateFamilyAction 테스트
 */

// Mock 설정 - import 전에 선언
jest.mock("@/lib/server/auth-helpers", () => ({
  requireAuth: jest.fn().mockResolvedValue({ user: { id: "test-user" } }),
}));

jest.mock("@/lib/server/api/client", () => ({
  serverApiClient: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import { updateFamilyAction } from "@/app/actions/family/update-family-action";
import { serverApiClient } from "@/lib/server/api/client";
import { requireAuth } from "@/lib/server/auth-helpers";
import { revalidatePath } from "next/cache";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockServerApiClient = serverApiClient as jest.MockedFunction<
  typeof serverApiClient
>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

describe("updateFamilyAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("가족 정보를 성공적으로 업데이트한다", async () => {
    // Given
    const mockSession = { user: { id: "test-user" } };
    mockRequireAuth.mockResolvedValue(mockSession as never);
    mockServerApiClient.mockResolvedValue({
      success: true,
      data: {
        uuid: "family-123",
        name: "수정된 가족",
        monthlyBudget: 1000000,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
        memberCount: 2,
        expenseCount: 5,
        categoryCount: 10,
      },
    });

    // When
    const result = await updateFamilyAction("family-123", {
      name: "수정된 가족",
      monthlyBudget: 1000000,
    });

    // Then
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe("수정된 가족");
      expect(result.data.monthlyBudget).toBe(1000000);
    }

    expect(mockServerApiClient).toHaveBeenCalledWith("/families/family-123", {
      method: "PUT",
      body: JSON.stringify({
        name: "수정된 가족",
        monthlyBudget: 1000000,
      }),
    });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/settings");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/families/family-123");
  });

  it("월 예산만 업데이트할 수 있다", async () => {
    // Given
    const mockSession = { user: { id: "test-user" } };
    mockRequireAuth.mockResolvedValue(mockSession as never);
    mockServerApiClient.mockResolvedValue({
      success: true,
      data: {
        uuid: "family-123",
        name: "기존 가족명",
        monthlyBudget: 2000000,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
        memberCount: 2,
        expenseCount: 5,
        categoryCount: 10,
      },
    });

    // When
    const result = await updateFamilyAction("family-123", {
      monthlyBudget: 2000000,
    });

    // Then
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.monthlyBudget).toBe(2000000);
    }

    expect(mockServerApiClient).toHaveBeenCalledWith("/families/family-123", {
      method: "PUT",
      body: JSON.stringify({
        monthlyBudget: 2000000,
      }),
    });
  });

  it("가족 UUID가 없으면 실패한다", async () => {
    // Given
    const mockSession = { user: { id: "test-user" } };
    mockRequireAuth.mockResolvedValue(mockSession as never);

    // When
    const result = await updateFamilyAction("", {
      name: "테스트 가족",
    });

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
    expect(mockServerApiClient).not.toHaveBeenCalled();
  });

  it("인증이 실패하면 에러를 반환한다", async () => {
    // Given
    mockRequireAuth.mockRejectedValue(new Error("Unauthorized"));

    // When
    const result = await updateFamilyAction("family-123", {
      name: "테스트 가족",
    });

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
    expect(mockServerApiClient).not.toHaveBeenCalled();
  });

  it("API 호출이 실패하면 에러를 반환한다", async () => {
    // Given
    const mockSession = { user: { id: "test-user" } };
    mockRequireAuth.mockResolvedValue(mockSession as never);
    mockServerApiClient.mockRejectedValue(new Error("Network error"));

    // When
    const result = await updateFamilyAction("family-123", {
      name: "테스트 가족",
    });

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});
