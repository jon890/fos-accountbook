/**
 * Income Actions 통합 테스트
 */

import { createIncomeAction } from "@/actions/income/create-income-action";
import { deleteIncomeAction } from "@/actions/income/delete-income-action";
import { serverApiPost, serverApiDelete } from "@/lib/server/api/client";

// Mock modules
jest.mock("@/lib/server/auth/auth-helpers", () => ({
  requireAuthOrRedirect: jest.fn(),
  requireAuth: jest.fn(),
  getSelectedFamilyUuid: jest.fn(),
}));

jest.mock("@/lib/server/api/client", () => ({
  serverApiPost: jest.fn(),
  serverApiDelete: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import {
  requireAuthOrRedirect,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";

const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

const mockRequireAuth = requireAuthOrRedirect as jest.MockedFunction<
  typeof requireAuthOrRedirect
>;

// Mock Session 데이터
const mockSession: Session = {
  user: {
    userUuid: "user-1",
    email: "test@example.com",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};
const mockGetSelectedFamilyUuid = getSelectedFamilyUuid as jest.MockedFunction<
  typeof getSelectedFamilyUuid
>;
const mockServerApiPost = serverApiPost as jest.MockedFunction<typeof serverApiPost>;
const mockServerApiDelete = serverApiDelete as jest.MockedFunction<typeof serverApiDelete>;

describe("Income Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createIncomeAction", () => {
    it("인증된 사용자가 수입을 성공적으로 생성할 수 있다", async () => {
      // Given
      mockRequireAuth.mockResolvedValue(mockSession);
      mockGetSelectedFamilyUuid.mockResolvedValue("family-1");

      mockServerApiPost.mockResolvedValue(undefined);

      const formData = new FormData();
      formData.append("familyUuid", "family-1");
      formData.append("amount", "50000");
      formData.append("description", "월급");
      formData.append("categoryId", "category-1");
      formData.append("date", "2024-10-21");

      const initialState = {
        message: "",
        errors: {},
        success: false,
      };

      // When
      const result = await createIncomeAction(initialState, formData);

      // Then
      expect(result.success).toBe(true);
      expect(result.message).toBe("수입이 성공적으로 추가되었습니다.");
      expect(mockServerApiPost).toHaveBeenCalledWith(
        "/families/family-1/incomes",
        expect.any(Object)
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith("/transactions");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/analytics");
    });

    it("familyUuid가 없으면 에러를 반환한다", async () => {
      // Given
      mockRequireAuth.mockResolvedValue(mockSession);
      mockGetSelectedFamilyUuid.mockResolvedValue(null);

      const formData = new FormData();
      formData.append("amount", "50000");
      formData.append("categoryId", "category-1");

      const initialState = {
        message: "",
        errors: {},
        success: false,
      };

      // When
      const result = await createIncomeAction(initialState, formData);

      // Then
      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "가족이 선택되지 않았습니다. 먼저 가족을 선택해주세요."
      );
    });

    it("유효하지 않은 금액이면 검증 에러를 반환한다", async () => {
      // Given
      mockRequireAuth.mockResolvedValue(mockSession);
      mockGetSelectedFamilyUuid.mockResolvedValue("family-1");

      const formData = new FormData();
      formData.append("familyUuid", "family-1");
      formData.append("amount", "-1000"); // 음수 금액
      formData.append("categoryId", "category-1");

      const initialState = {
        message: "",
        errors: {},
        success: false,
      };

      // When
      const result = await createIncomeAction(initialState, formData);

      // Then
      expect(result.success).toBe(false);
      expect(result.message).toBe("입력값을 확인해주세요.");
      expect(result.errors?.amount).toBeDefined();
    });
  });

  describe("deleteIncomeAction", () => {
    it("인증된 사용자가 수입을 성공적으로 삭제할 수 있다", async () => {
      // Given
      mockRequireAuth.mockResolvedValue(mockSession);

      mockServerApiDelete.mockResolvedValue(undefined);

      // When
      const result = await deleteIncomeAction("family-1", "income-1");

      // Then
      expect(result.success).toBe(true);
      expect(mockServerApiDelete).toHaveBeenCalledWith(
        "/families/family-1/incomes/income-1"
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith("/transactions");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/analytics");
    });

    it("API 호출 실패 시 에러를 반환한다", async () => {
      // Given
      mockRequireAuth.mockResolvedValue(mockSession);

      mockServerApiDelete.mockRejectedValue(new Error("API Error"));

      // When
      const result = await deleteIncomeAction("family-1", "income-1");

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });
});
