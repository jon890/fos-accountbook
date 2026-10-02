import { z } from "zod";
import type { ApiToken, CreatedApiToken } from "@/types/api-token";
import type { UserProfile } from "@/types";
import { isoDateString, uuidString } from "./common";

/**
 * 사용자 프로필, API 토큰 응답 스키마 (ADR-F42)
 *
 * 백엔드 `UserProfileResponse`, `ApiTokenResponse`, `CreatedApiTokenResponse` 와 맞춘다.
 */

/** `defaultFamilyUuid` 는 가족을 고르기 전이면 null 이다. */
export const userProfileSchema = z.object({
  timezone: z.string(),
  language: z.string(),
  currency: z.string(),
  defaultFamilyUuid: uuidString.nullable(),
}) satisfies z.ZodType<UserProfile>;

/** `lastUsedAt` 은 한 번도 쓰지 않은 토큰이면 null 이다. */
export const apiTokenSchema = z.object({
  uuid: uuidString,
  name: z.string(),
  tokenPrefix: z.string(),
  lastUsedAt: isoDateString.nullable(),
  createdAt: isoDateString,
}) satisfies z.ZodType<ApiToken>;

export const apiTokenListSchema = z.array(apiTokenSchema) satisfies z.ZodType<ApiToken[]>;

/** 발급 응답에만 원문 `token` 이 있다. */
export const createdApiTokenSchema = apiTokenSchema.extend({
  token: z.string().min(1),
}) satisfies z.ZodType<CreatedApiToken>;
