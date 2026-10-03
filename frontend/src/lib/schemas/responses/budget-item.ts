import { z } from "zod";
import type { BudgetItem, BudgetSummary } from "@/types/budget-item";
import { isoDateString, uuidString } from "./common";

/**
 * 예산 항목 응답 스키마 (ADR-F42)
 *
 * 백엔드 `BudgetItemResponse`, `BudgetSummaryResponse` 와 맞춘다.
 * 금액은 `BigDecimal` 이 JSON 숫자로 직렬화된 값이라 문자열을 받지 않는다.
 */

export const budgetItemResponseSchema = z.object({
  uuid: uuidString,
  name: z.string(),
  monthlyLimit: z.number(),
  categoryUuids: z.array(uuidString),
  createdAt: isoDateString,
  updatedAt: isoDateString,
}) satisfies z.ZodType<BudgetItem>;

export const budgetItemListResponseSchema = z.array(budgetItemResponseSchema);

export const budgetSummaryResponseSchema = z.object({
  year: z.number(),
  month: z.number(),
  total: z.object({ spent: z.number(), limit: z.number() }),
  living: z.object({ spent: z.number(), limit: z.number() }),
  allocationExceeded: z.boolean(),
  items: z.array(
    z.object({
      budgetItemUuid: uuidString,
      name: z.string(),
      limit: z.number(),
      spent: z.number(),
    }),
  ),
}) satisfies z.ZodType<BudgetSummary>;
