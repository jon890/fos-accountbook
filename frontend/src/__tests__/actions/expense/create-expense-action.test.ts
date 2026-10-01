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
jest.mock("@/services/expense/expense-service");
jest.mock("next/cache");

import { createExpenseAction } from "@/actions/expense/create-expense-action";
import { serverApiClient } from "@/lib/server/api/client";
import {
  requireAuthOrRedirect,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { revalidatePath } from "next/cache";
import { createExpense } from "@/services/expense/expense-service";

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
const mockCreateExpense = createExpense as jest.MockedFunction<typeof createExpense>;

describe("createExpenseAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuthOrRedirect.mockResolvedValue(undefined as never);
    mockCreateExpense.mockResolvedValue(undefined);
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
    expect(mockRevalidatePath).toHaveBeenCalledWith("/calendar");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/budget");
    expect(mockRevalidatePath).not.toHaveBeenCalledWith("/");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/analytics");
  });

  it.each([true, false])("excludeFromBudget=%s를 서비스 요청에 전달한다", async (excludeFromBudget) => {
    mockGetSelectedFamilyUuid.mockResolvedValue("family-1");
    const formData = new FormData();
    formData.append("amount", "10000");
    formData.append("categoryId", "category-1");
    formData.append("excludeFromBudget", String(excludeFromBudget));

    await createExpenseAction({ success: false, message: "", errors: {} }, formData);

    expect(mockCreateExpense).toHaveBeenCalledWith(
      "family-1",
      expect.objectContaining({ excludeFromBudget }),
    );
  });

  it("excludeFromBudget가 없으면 서비스 요청 객체에 넣지 않는다", async () => {
    mockGetSelectedFamilyUuid.mockResolvedValue("family-1");
    const formData = new FormData();
    formData.append("amount", "10000");
    formData.append("categoryId", "category-1");

    await createExpenseAction({ success: false, message: "", errors: {} }, formData);

    expect(mockCreateExpense.mock.calls[0][1]).not.toHaveProperty("excludeFromBudget");
  });
});
