/**
 * updateIncomeAction 테스트
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
jest.mock("@/lib/server/api/client");
jest.mock("next/cache");

import { updateIncomeAction } from "@/actions/income/update-income-action";
import { serverApiClient } from "@/lib/server/api/client";
import { requireAuth, getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockGetSelectedFamilyUuid = getSelectedFamilyUuid as jest.MockedFunction<typeof getSelectedFamilyUuid>;
const mockServerApiClient = serverApiClient as jest.MockedFunction<
  typeof serverApiClient
>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

const mockSession: Session = {
  user: { userUuid: "user-1" },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

describe("updateIncomeAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue(mockSession);
    mockGetSelectedFamilyUuid.mockResolvedValue("family-1");
  });

  it("수입 수정 성공 시 /transactions, /, /analytics를 revalidate한다", async () => {
    // Given
    mockServerApiClient.mockResolvedValue({ data: { uuid: "income-1" } });

    const formData = new FormData();
    formData.append("incomeUuid", "income-1");
    formData.append("familyUuid", "family-1");
    formData.append("amount", "50000");
    formData.append("categoryId", "category-1");
    formData.append("date", "2025-01-15");

    const initialState = { success: false, message: "", errors: {} };

    // When
    const result = await updateIncomeAction(initialState, formData);

    // Then
    expect(result.success).toBe(true);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/transactions");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/analytics");
  });

  it("familyUuid가 세션과 다르면 권한 에러를 반환한다", async () => {
    // Given
    const formData = new FormData();
    formData.append("incomeUuid", "income-1");
    formData.append("familyUuid", "attacker-family-uuid");
    formData.append("amount", "50000");

    const initialState = { success: false, message: "", errors: {} };

    // When
    const result = await updateIncomeAction(initialState, formData);

    // Then
    expect(result.success).toBe(false);
    expect(result.message).toBe("권한이 없습니다.");
  });

  it("세션에 가족 정보가 없으면 에러를 반환한다", async () => {
    // Given
    mockGetSelectedFamilyUuid.mockResolvedValueOnce(null);

    const formData = new FormData();
    formData.append("incomeUuid", "income-1");
    formData.append("familyUuid", "family-1");
    formData.append("amount", "50000");

    const initialState = { success: false, message: "", errors: {} };

    // When
    const result = await updateIncomeAction(initialState, formData);

    // Then
    expect(result.success).toBe(false);
    expect(result.message).toBe("가족 정보를 찾을 수 없습니다.");
  });
});
