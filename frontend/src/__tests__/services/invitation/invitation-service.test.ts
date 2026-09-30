/**
 * invitation-service 단위 테스트
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
jest.mock("@/lib/server/api/client");

import { ActionError } from "@/lib/errors";
import { serverApiClient, serverApiGet } from "@/lib/server/api/client";
import {
  assertInvitationOwnership,
  getInvitationInfo,
} from "@/services/invitation/invitation-service";

const mockServerApiClient = serverApiClient as jest.MockedFunction<
  typeof serverApiClient
>;
const mockServerApiGet = serverApiGet as jest.MockedFunction<
  typeof serverApiGet
>;

const FAMILY_UUID = "family-uuid-1";
const INVITATION_UUID = "550e8400-e29b-41d4-a716-446655440000";

function pendingInvitation(extra: Record<string, unknown> = {}) {
  return {
    uuid: INVITATION_UUID,
    familyUuid: FAMILY_UUID,
    familyName: "우리집",
    token: "token-1",
    status: "PENDING",
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    createdAt: new Date().toISOString(),
    isExpired: false,
    isUsed: false,
    ...extra,
  };
}

describe("getInvitationInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("초대자와 멤버 수가 있으면 평평한 값으로 반환한다", async () => {
    mockServerApiClient.mockResolvedValue({
      data: pendingInvitation({
        inviter: { name: "홍길동", avatarUrl: "https://img" },
        memberCount: 2,
      }),
    });

    const result = await getInvitationInfo("token-1");

    expect(result.valid).toBe(true);
    expect(result.inviterName).toBe("홍길동");
    expect(result.inviterAvatarUrl).toBe("https://img");
    expect(result.memberCount).toBe(2);
  });

  it("초대자가 null 이고 멤버 수가 없으면 이름과 멤버 수는 비고 아바타는 null 이다", async () => {
    mockServerApiClient.mockResolvedValue({
      data: pendingInvitation({ inviter: null }),
    });

    const result = await getInvitationInfo("token-1");

    expect(result.valid).toBe(true);
    expect(result.inviterName).toBeUndefined();
    expect(result.inviterAvatarUrl).toBeNull();
    expect(result.memberCount).toBeUndefined();
  });
});

describe("assertInvitationOwnership", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("활성 초대 목록에 uuid 가 있으면 resolve 한다", async () => {
    mockServerApiGet.mockResolvedValue([pendingInvitation()]);

    await expect(
      assertInvitationOwnership(FAMILY_UUID, INVITATION_UUID)
    ).resolves.toBeUndefined();
  });

  it("목록에 없으면 C002 ActionError 로 reject 한다", async () => {
    mockServerApiGet.mockResolvedValue([]);

    const promise = assertInvitationOwnership(FAMILY_UUID, INVITATION_UUID);

    await expect(promise).rejects.toBeInstanceOf(ActionError);
    await expect(promise).rejects.toMatchObject({ code: "C002" });
  });
});
