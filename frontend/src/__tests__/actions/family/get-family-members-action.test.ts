/** @jest-environment node */

import { getFamilyMembersAction } from "@/actions/family/get-family-members-action";
import { ActionError } from "@/lib/errors";
import { getSelectedFamilyUuid, requireAuth } from "@/lib/server/auth/auth-helpers";
import { getFamilyMembers } from "@/services/family/family-service";

jest.mock("@/lib/server/auth/auth-helpers", () => ({
  requireAuth: jest.fn(),
  getSelectedFamilyUuid: jest.fn(),
}));
jest.mock("@/services/family/family-service", () => ({ getFamilyMembers: jest.fn() }));

const members = [{
  userUuid: "22222222-2222-2222-2222-222222222222",
  name: "민지",
  email: "minji@example.com",
  image: null,
  role: "OWNER" as const,
  joinedAt: "2026-01-01T00:00:00.000Z",
}];

describe("getFamilyMembersAction", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(requireAuth).mockResolvedValue({ user: { id: "user" } } as never);
    jest.mocked(getSelectedFamilyUuid).mockResolvedValue("11111111-1111-1111-1111-111111111111");
  });

  it("선택된 가족의 구성원을 반환한다", async () => {
    jest.mocked(getFamilyMembers).mockResolvedValue(members);

    await expect(getFamilyMembersAction()).resolves.toEqual({ success: true, data: members });
    expect(getFamilyMembers).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111");
  });

  it("인증 실패를 인증 오류로 반환하고 서비스를 호출하지 않는다", async () => {
    jest.mocked(requireAuth).mockRejectedValue(ActionError.unauthorized());

    await expect(getFamilyMembersAction()).resolves.toMatchObject({ success: false, error: { code: "A001" } });
    expect(getFamilyMembers).not.toHaveBeenCalled();
  });

  it("가족을 선택하지 않았으면 F002를 반환하고 서비스를 호출하지 않는다", async () => {
    jest.mocked(getSelectedFamilyUuid).mockResolvedValue(null);

    await expect(getFamilyMembersAction()).resolves.toMatchObject({ success: false, error: { code: "F002" } });
    expect(getFamilyMembers).not.toHaveBeenCalled();
  });

  it("서비스 실패를 Action 실패로 전파한다", async () => {
    jest.mocked(getFamilyMembers).mockRejectedValue(new Error("구성원 조회 실패"));

    await expect(getFamilyMembersAction()).resolves.toMatchObject({
      success: false,
      error: { message: "가족 구성원을 불러오는데 실패했습니다" },
    });
  });
});
