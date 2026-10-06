import { z } from "zod";
import type {
  GetRecurringExpensesResponse,
  RecurringExpense,
} from "@/types/recurring-expense";
import { isoDateString, uuidString } from "./common";
import { categoryInfoSchema } from "./transaction";

/**
 * 고정지출 응답 스키마 (ADR-F42)
 *
 * 백엔드 `RecurringExpenseResponse`, `GetRecurringExpensesResponse` 와 맞춘다.
 * `category` 는 `CategoryInfo` 이고, 가족 카테고리 목록에 없으면 null 이다.
 * 금액은 `BigDecimal` 이 JSON 숫자로 직렬화된 값이다.
 */

export const recurringExpenseResponseSchema = z.object({
  uuid: uuidString,
  familyUuid: uuidString,
  categoryUuid: uuidString,
  category: categoryInfoSchema.nullable(),
  name: z.string(),
  amount: z.number(),
  dayOfMonth: z.number(),
  status: z.enum(["ACTIVE", "ENDED"]),
  generatedThisMonth: z.boolean(),
  createdAt: isoDateString,
  updatedAt: isoDateString,
}) satisfies z.ZodType<RecurringExpense>;

export const getRecurringExpensesResponseSchema = z.object({
  totalMonthlyAmount: z.number(),
  items: z.array(recurringExpenseResponseSchema),
}) satisfies z.ZodType<GetRecurringExpensesResponse>;

/** `GET /recurring-expenses/monthly-total` 은 `BigDecimal` 하나를 돌려준다. */
export const recurringExpensesMonthlyTotalSchema = z.number();
