/**
 * deleteInvitationAction 테스트
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

import { deleteInvitationAction } from "@/actions/invitation/delete-invitation-action";
import { ActionError } from "@/lib/errors";
import {
  getSelectedFamilyUuid,
  requireAuth,
} from "@/lib/server/auth/auth-helpers";
import {
  assertInvitationOwnership,
  deleteInvitation,
} from "@/services/invitation/invitation-service";
import type { Session } from "next-auth";
import { revalidatePath } from "next/cache";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockGetSelectedFamilyUuid = getSelectedFamilyUuid as jest.MockedFunction<
  typeof getSelectedFamilyUuid
>;
const mockAssertOwnership = assertInvitationOwnership as jest.MockedFunction<
  typeof assertInvitationOwnership
>;
const mockDeleteInvitation = deleteInvitation as jest.MockedFunction<
  typeof deleteInvitation
>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const FAMILY_UUID = "family-uuid-1";

const mockSession: Session = {
  user: {
    userUuid: "user-1",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

describe("deleteInvitationAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue(mockSession);
    mockGetSelectedFamilyUuid.mockResolvedValue(FAMILY_UUID);
  });

  it("소유 확인 통과 → deleteInvitation + revalidatePath + success", async () => {
    mockAssertOwnership.mockResolvedValue(undefined);
    mockDeleteInvitation.mockResolvedValue(undefined);

    const result = await deleteInvitationAction(VALID_UUID);

    expect(result.success).toBe(true);
    expect(mockAssertOwnership).toHaveBeenCalledWith(FAMILY_UUID, VALID_UUID);
    expect(mockDeleteInvitation).toHaveBeenCalledWith(VALID_UUID);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("소유 확인 실패 → 에러 반환, deleteInvitation 호출 없음", async () => {
    mockAssertOwnership.mockRejectedValue(
      ActionError.entityNotFound("초대 링크", VALID_UUID)
    );

    const result = await deleteInvitationAction(VALID_UUID);

    expect(result.success).toBe(false);
    expect(mockDeleteInvitation).not.toHaveBeenCalled();
  });

  it("선택 가족 없음 → 에러 반환, 소유 확인 호출 없음", async () => {
    mockGetSelectedFamilyUuid.mockResolvedValue(null);

    const result = await deleteInvitationAction(VALID_UUID);

    expect(result.success).toBe(false);
    expect(mockAssertOwnership).not.toHaveBeenCalled();
  });

  it("uuid 형식이 아니면 에러 반환, 소유 확인과 삭제 호출 없음", async () => {
    const result = await deleteInvitationAction("not-a-uuid");

    expect(result.success).toBe(false);
    expect(mockAssertOwnership).not.toHaveBeenCalled();
    expect(mockDeleteInvitation).not.toHaveBeenCalled();
  });
});
