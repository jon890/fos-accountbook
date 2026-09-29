/**
 * getInvitationInfoAction 테스트
 * @jest-environment node
 */

jest.mock("@/lib/env/server.env", () => ({
  serverEnv: {
    BACKEND_API_URL: "http://localhost:8080",
    AUTH_URL: "http://localhost:3000",
  },
}));
jest.mock("@/lib/server/auth/auth", () => ({
  handlers: {},
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock("@/services/invitation/invitation-service");

import { getInvitationInfoAction } from "@/actions/invitation/get-invitation-info-action";
import { getInvitationInfo } from "@/services/invitation/invitation-service";

const mockGetInvitationInfo = getInvitationInfo as jest.MockedFunction<
  typeof getInvitationInfo
>;

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("getInvitationInfoAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("잘못된 토큰 형식", () => {
    it.each([
      ["빈 문자열", ""],
      ["UUID 아닌 문자열", "not-a-uuid"],
      ["스크립트 주입 시도", "<script>alert(1)</script>"],
      ["일반 문자열", "abc123"],
    ])("%s → 에러 반환, service 호출 없음", async (_, token) => {
      const result = await getInvitationInfoAction(token);

      expect(result.success).toBe(false);
      expect(mockGetInvitationInfo).not.toHaveBeenCalled();
    });
  });

  it("유효한 UUID → service 호출 후 successResult 반환", async () => {
    const mockData = {
      valid: true,
      familyName: "테스트 가족",
      expiresAt: new Date("2026-12-31"),
    };
    mockGetInvitationInfo.mockResolvedValue(mockData);

    const result = await getInvitationInfoAction(VALID_UUID);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockData);
    }
    expect(mockGetInvitationInfo).toHaveBeenCalledWith(VALID_UUID);
    expect(mockGetInvitationInfo).toHaveBeenCalledTimes(1);
  });

  it("service 에러 → 에러 ActionResult 반환", async () => {
    mockGetInvitationInfo.mockRejectedValue(new Error("서비스 오류"));

    const result = await getInvitationInfoAction(VALID_UUID);

    expect(result.success).toBe(false);
  });
});
