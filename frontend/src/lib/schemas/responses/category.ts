import { z } from "zod";
import type { CategoryResponse } from "@/types/category";
import { isoDateString, uuidString } from "./common";

/**
 * 카테고리 응답 스키마 (ADR-F42)
 *
 * 백엔드 `CategoryResponse` 와 맞춘다.
 * `icon` 은 `categories.icon` 컬럼이 null 을 허용해 null 로 온다. `CategoryInfo.icon` 과 같은 처리다.
 */
export const categoryResponseSchema = z.object({
  uuid: uuidString,
  familyUuid: uuidString,
  type: z.enum(["EXPENSE", "INCOME"]),
  name: z.string(),
  icon: z.string().nullable(),
  color: z.string(),
  excludeFromBudget: z.boolean(),
  createdAt: isoDateString,
  updatedAt: isoDateString,
}) satisfies z.ZodType<CategoryResponse>;
