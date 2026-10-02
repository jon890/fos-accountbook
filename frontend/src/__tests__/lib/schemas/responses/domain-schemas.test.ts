import { categoryResponseSchema } from "@/lib/schemas/responses/category";
import {
  familyListSchema,
  familyMemberListSchema,
} from "@/lib/schemas/responses/family";
import { invitationSchema } from "@/lib/schemas/responses/invitation";
import {
  notificationListSchema,
  unreadCountSchema,
} from "@/lib/schemas/responses/notification";
import {
  apiTokenListSchema,
  createdApiTokenSchema,
  userProfileSchema,
} from "@/lib/schemas/responses/user";

/**
 * 가족, 사용자, API 토큰, 알림, 초대, 카테고리 응답 스키마 (ADR-F42)
 * 픽스처는 백엔드 DTO 가 Jackson 으로 직렬화된 모양이다. null 필드도 키를 남긴다.
 */

const FAMILY_UUID = "11111111-1111-1111-1111-111111111111";
const USER_UUID = "22222222-2222-2222-2222-222222222222";
const createdAt = "2026-10-01T09:00:00";

const family = {
  uuid: FAMILY_UUID,
  name: "우리집",
  monthlyBudget: 1500000,
  createdAt,
  updatedAt: createdAt,
  memberCount: 2,
  expenseCount: 0,
  categoryCount: 0,
};

const member = {
  userUuid: USER_UUID,
  name: null,
  email: "a@example.com",
  image: null,
  role: "OWNER",
  joinedAt: createdAt,
};

const profile = {
  userUuid: USER_UUID,
  timezone: "Asia/Seoul",
  language: "ko",
  currency: "KRW",
  defaultFamilyUuid: null,
  createdAt,
  updatedAt: createdAt,
};

const apiToken = {
  uuid: "44444444-4444-4444-4444-444444444444",
  name: "에이전트",
  tokenPrefix: "fab_abcd1234",
  lastUsedAt: null,
  createdAt,
};

const notification = {
  notificationUuid: "66666666-6666-6666-6666-666666666666",
  familyUuid: FAMILY_UUID,
  userUuid: null,
  type: "BUDGET_80_EXCEEDED",
  typeDisplayName: "예산 80% 초과",
  title: "예산 알림",
  message: "이번 달 예산의 80%를 초과했습니다.",
  referenceUuid: null,
  referenceType: null,
  yearMonth: "2026-10",
  isRead: false,
  createdAt,
};

/** `InvitationResponse.from()` 결과. 이름, 초대자, 구성원 수가 채워지지 않아 null 이다. */
const invitation = {
  uuid: "77777777-7777-7777-7777-777777777777",
  familyUuid: FAMILY_UUID,
  familyName: null,
  token: "invite-token",
  status: "PENDING",
  expiresAt: "2026-10-02T09:00:00",
  createdAt,
  expired: false,
  used: false,
  inviter: null,
  memberCount: null,
};

const category = {
  uuid: "33333333-3333-3333-3333-333333333331",
  familyUuid: FAMILY_UUID,
  name: "식비",
  color: "#ef4444",
  icon: null,
  excludeFromBudget: false,
  type: "EXPENSE",
  createdAt,
  updatedAt: createdAt,
};

function without(source: Record<string, unknown>, key: string) {
  const copy = { ...source };
  delete copy[key];
  return copy;
}

function failedPaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues.map((issue) => issue.path.map(String).join(".")) ?? [];
}

describe("가족 응답 스키마", () => {
  it("가족 목록을 통과시킨다", () => {
    expect(failedPaths(familyListSchema.safeParse([family]))).toEqual([]);
  });

  it("빈 가족 목록을 통과시킨다", () => {
    expect(failedPaths(familyListSchema.safeParse([]))).toEqual([]);
  });

  it("memberCount 가 빠지면 그 경로로 실패한다", () => {
    const result = familyListSchema.safeParse([without(family, "memberCount")]);

    expect(failedPaths(result)).toEqual(["0.memberCount"]);
  });

  it("구성원의 null 이름과 null 이미지를 통과시킨다", () => {
    expect(failedPaths(familyMemberListSchema.safeParse([member]))).toEqual([]);
  });

  it("구성원 role 이 enum 이름이 아니면 실패한다", () => {
    const result = familyMemberListSchema.safeParse([{ ...member, role: "owner" }]);

    expect(failedPaths(result)).toEqual(["0.role"]);
  });
});

describe("사용자 프로필, API 토큰 응답 스키마", () => {
  it("defaultFamilyUuid 가 null 인 프로필을 통과시킨다", () => {
    expect(failedPaths(userProfileSchema.safeParse(profile))).toEqual([]);
  });

  it("프로필에 timezone 이 빠지면 실패한다", () => {
    expect(failedPaths(userProfileSchema.safeParse(without(profile, "timezone")))).toEqual([
      "timezone",
    ]);
  });

  it("lastUsedAt 이 null 인 토큰 목록을 통과시킨다", () => {
    expect(failedPaths(apiTokenListSchema.safeParse([apiToken]))).toEqual([]);
  });

  it("발급 응답에 원문 token 이 빠지면 실패한다", () => {
    expect(failedPaths(createdApiTokenSchema.safeParse(apiToken))).toEqual(["token"]);
  });
});

describe("알림 응답 스키마", () => {
  it("userUuid, referenceUuid, referenceType 이 null 인 알림 목록을 통과시킨다", () => {
    const result = notificationListSchema.safeParse({
      notifications: [notification],
      unreadCount: 1,
      totalCount: 1,
    });

    expect(failedPaths(result)).toEqual([]);
  });

  it("알림에 isRead 가 빠지면 실패한다", () => {
    const result = notificationListSchema.safeParse({
      notifications: [without(notification, "isRead")],
      unreadCount: 1,
      totalCount: 1,
    });

    expect(failedPaths(result)).toEqual(["notifications.0.isRead"]);
  });

  it("읽지 않은 수 0 을 통과시키고 키가 없으면 실패한다", () => {
    expect(failedPaths(unreadCountSchema.safeParse({ unreadCount: 0 }))).toEqual([]);
    expect(failedPaths(unreadCountSchema.safeParse({}))).toEqual(["unreadCount"]);
  });
});

describe("초대 응답 스키마", () => {
  it("familyName, inviter, memberCount 가 null 인 초대를 통과시킨다", () => {
    expect(failedPaths(invitationSchema.safeParse(invitation))).toEqual([]);
  });

  it("초대자 이름이 null 이어도 통과시킨다", () => {
    const result = invitationSchema.safeParse({
      ...invitation,
      inviter: { name: null, avatarUrl: null },
    });

    expect(failedPaths(result)).toEqual([]);
  });

  it("expiresAt 이 빠지면 실패한다", () => {
    expect(failedPaths(invitationSchema.safeParse(without(invitation, "expiresAt")))).toEqual([
      "expiresAt",
    ]);
  });
});

describe("카테고리 응답 스키마", () => {
  it("icon 이 null 인 카테고리를 통과시킨다", () => {
    expect(failedPaths(categoryResponseSchema.safeParse(category))).toEqual([]);
  });

  it("type 이 빠지면 실패한다", () => {
    expect(failedPaths(categoryResponseSchema.safeParse(without(category, "type")))).toEqual([
      "type",
    ]);
  });
});
