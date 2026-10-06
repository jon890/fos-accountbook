import { z } from "zod";
import type {
  CreateFamilyResult,
  Family,
  FamilyMemberSummary,
} from "@/types/family";
import { isoDateString, uuidString } from "./common";

/**
 * 가족 응답 스키마 (ADR-F42)
 *
 * 백엔드 `FamilyResponse`, `FamilyMemberResponse` 와 맞춘다.
 * `getFamilies()` 는 ADR-F25 의 가족 접근 확인이 부르므로, 이 스키마가 틀리면 그 확인을 거치는 Action 이 모두 내부 오류가 된다.
 */

/** 백엔드 `FamilyResponse`. 세 개수는 원시형 `long` 이라 null 이 오지 않는다. */
export const familySchema = z.object({
  uuid: uuidString,
  name: z.string(),
  monthlyBudget: z.number(),
  createdAt: isoDateString,
  updatedAt: isoDateString,
  memberCount: z.number(),
  expenseCount: z.number(),
  categoryCount: z.number(),
}) satisfies z.ZodType<Family>;

export const familyListSchema = z.array(familySchema) satisfies z.ZodType<Family[]>;

/** `POST /families` 도 `FamilyResponse` 를 돌려준다. */
export const createFamilyResultSchema = familySchema satisfies z.ZodType<CreateFamilyResult>;

/**
 * 백엔드 `FamilyMemberResponse`.
 * `name`, `image` 는 `users` 컬럼이 null 을 허용한다. `role` 은 enum 이름으로 직렬화된다.
 */
export const familyMemberSchema = z.object({
  userUuid: uuidString,
  name: z.string().nullable(),
  email: z.string(),
  image: z.string().nullable(),
  role: z.enum(["OWNER", "MEMBER"]),
  joinedAt: isoDateString,
}) satisfies z.ZodType<FamilyMemberSummary>;

export const familyMemberListSchema = z.array(
  familyMemberSchema
) satisfies z.ZodType<FamilyMemberSummary[]>;
