/**
 * createExpenseAction 테스트
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

import { createExpenseAction } from "@/actions/expense/create-expense-action";
import { serverApiClient } from "@/lib/server/api/client";
import {
  requireAuthOrRedirect,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { revalidatePath } from "next/cache";

const mockRequireAuthOrRedirect = requireAuthOrRedirect as jest.MockedFunction<
  typeof requireAuthOrRedirect
>;
const mockGetSelectedFamilyUuid = getSelectedFamilyUuid as jest.MockedFunction<
  typeof getSelectedFamilyUuid
>;
const mockServerApiClient = serverApiClient as jest.MockedFunction<
  typeof serverApiClient
>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

describe("createExpenseAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuthOrRedirect.mockResolvedValue(undefined as never);
  });

  it("지출 생성 성공 시 /transactions, /, /analytics를 revalidate한다", async () => {
    // Given
    mockGetSelectedFamilyUuid.mockResolvedValue("family-1");
    mockServerApiClient.mockResolvedValue({ data: { uuid: "expense-1" } });

    const formData = new FormData();
    formData.append("amount", "10000");
    formData.append("categoryId", "category-1");
    formData.append("date", "2025-01-15");

    const initialState = { success: false, message: "", errors: {} };

    // When
    const result = await createExpenseAction(initialState, formData);

    // Then
    expect(result.success).toBe(true);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/transactions");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/analytics");
  });
});
