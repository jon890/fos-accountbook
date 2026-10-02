import { z } from "zod";
import type { InvitationResponse } from "@/types/invitation";
import { isoDateString, uuidString } from "./common";

/**
 * 초대 응답 스키마 (ADR-F42)
 *
 * 백엔드 `InvitationResponse` 와 맞춘다.
 * 백엔드의 원시형 `boolean isExpired`, `isUsed` 는 JSON 키가 `expired`, `used` 다.
 * 서비스는 만료와 사용 여부를 `status` 와 `expiresAt` 으로 직접 계산하므로 두 키는 검증하지 않는다.
 * `familyName`, `inviter`, `memberCount` 는 조회 경로에 따라 채워지지 않으면 null 이다.
 */

const inviterSchema = z.object({
  // `users.name` 컬럼은 null 을 허용한다.
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

export const invitationSchema = z.object({
  uuid: uuidString,
  familyUuid: uuidString,
  familyName: z.string().nullable(),
  token: z.string().min(1),
  status: z.string(),
  expiresAt: isoDateString,
  createdAt: isoDateString,
  inviter: inviterSchema.nullable(),
  memberCount: z.number().nullable(),
}) satisfies z.ZodType<InvitationResponse>;

export const invitationListSchema = z.array(
  invitationSchema
) satisfies z.ZodType<InvitationResponse[]>;
