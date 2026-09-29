/**
 * acceptInvitationAction 테스트
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
jest.mock("@/lib/server/auth/auth-helpers");
jest.mock("@/services/invitation/invitation-service");
jest.mock("next/cache");

import { acceptInvitationAction } from "@/actions/invitation/accept-invitation-action";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { acceptInvitation } from "@/services/invitation/invitation-service";
import type { Session } from "next-auth";
import { revalidatePath } from "next/cache";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockAcceptInvitation = acceptInvitation as jest.MockedFunction<
  typeof acceptInvitation
>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

const mockSession: Session = {
  user: {
    userUuid: "user-1",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

describe("acceptInvitationAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue(mockSession);
  });

  describe("잘못된 토큰 형식", () => {
    it.each([
      ["빈 문자열", ""],
      ["UUID 아닌 문자열", "not-a-uuid"],
      ["스크립트 주입 시도", "<script>alert(1)</script>"],
    ])("%s → 에러 반환, acceptInvitation 호출 없음", async (_, token) => {
      const result = await acceptInvitationAction(token);

      expect(result.success).toBe(false);
      expect(mockAcceptInvitation).not.toHaveBeenCalled();
    });
  });

  it("유효한 UUID → acceptInvitation 호출 + revalidatePath + successResult", async () => {
    mockAcceptInvitation.mockResolvedValue(undefined);

    const result = await acceptInvitationAction(VALID_UUID);

    expect(result.success).toBe(true);
    expect(mockAcceptInvitation).toHaveBeenCalledWith(VALID_UUID);
    expect(mockAcceptInvitation).toHaveBeenCalledTimes(1);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("service 에러 → 에러 ActionResult 반환", async () => {
    mockAcceptInvitation.mockRejectedValue(new Error("서비스 오류"));

    const result = await acceptInvitationAction(VALID_UUID);

    expect(result.success).toBe(false);
  });
});
