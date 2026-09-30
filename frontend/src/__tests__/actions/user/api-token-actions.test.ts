/**
 * 연동 토큰 Server Action 테스트
 * @jest-environment node
 */

jest.mock("@/lib/env/server.env", () => ({
  serverEnv: {
    BACKEND_API_URL: "http://localhost:8080",
  },
}));

jest.mock("@/lib/server/auth/auth-helpers", () => ({
  requireAuth: jest.fn().mockResolvedValue({ user: { id: "test-user" } }),
}));

jest.mock("@/services/user/api-token-service");

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import { createApiTokenAction } from "@/actions/user/create-api-token-action";
import { getApiTokensAction } from "@/actions/user/get-api-tokens-action";
import { revokeApiTokenAction } from "@/actions/user/revoke-api-token-action";
import { ServerApiError } from "@/lib/server/api/types";
import {
  createApiToken,
  getApiTokens,
  revokeApiToken,
} from "@/services/user/api-token-service";
import { revalidatePath } from "next/cache";

const mockCreate = createApiToken as jest.MockedFunction<typeof createApiToken>;
const mockGet = getApiTokens as jest.MockedFunction<typeof getApiTokens>;
const mockRevoke = revokeApiToken as jest.MockedFunction<typeof revokeApiToken>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

const TOKEN_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("연동 토큰 Server Action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createApiTokenAction", () => {
    it("발급에 성공하면 결과를 돌려주고 /settings 를 갱신한다", async () => {
      const created = {
        uuid: TOKEN_UUID,
        name: "fos-assistant",
        tokenPrefix: "fab_abcd1234",
        lastUsedAt: null,
        createdAt: "2026-01-01T00:00:00Z",
        token: "fab_secret",
      };
      mockCreate.mockResolvedValue(created);

      const result = await createApiTokenAction("fos-assistant");

      expect(result).toEqual({ success: true, data: created });
      expect(mockCreate).toHaveBeenCalledWith("fos-assistant");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/settings");
    });

    it("공백뿐인 이름은 service 를 부르지 않고 실패한다", async () => {
      const result = await createApiTokenAction("   ");

      expect(result.success).toBe(false);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("51자 이름은 service 를 부르지 않고 실패한다", async () => {
      const result = await createApiTokenAction("a".repeat(51));

      expect(result.success).toBe(false);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("한도 초과 업무 오류의 서버 문구를 전달한다", async () => {
      mockCreate.mockRejectedValue(
        new ServerApiError("x", 400, {
          code: "AT002",
          message: "연동 토큰은 5개까지 만들 수 있습니다",
        })
      );

      const result = await createApiTokenAction("x");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          "연동 토큰은 5개까지 만들 수 있습니다"
        );
      }
    });
  });

  describe("revokeApiTokenAction", () => {
    it("uuid 로 service 를 부르고 성공한다", async () => {
      mockRevoke.mockResolvedValue(undefined);

      const result = await revokeApiTokenAction(TOKEN_UUID);

      expect(result.success).toBe(true);
      expect(mockRevoke).toHaveBeenCalledWith(TOKEN_UUID);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/settings");
    });

    it("uuid 형식이 아니면 service 를 부르지 않고 실패한다", async () => {
      const result = await revokeApiTokenAction("not-a-uuid");

      expect(result.success).toBe(false);
      expect(mockRevoke).not.toHaveBeenCalled();
    });
  });

  describe("getApiTokensAction", () => {
    it("service 가 실패하면 기본 문구로 실패한다", async () => {
      mockGet.mockRejectedValue(new Error("boom"));

      const result = await getApiTokensAction();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("연동 토큰 목록을 불러오지 못했습니다");
      }
    });
  });
});
