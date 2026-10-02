import { z } from "zod";
import type { CategoryInfo } from "@/types/common";
import type { Expense, GetExpensesResponse } from "@/types/expense";
import type { GetIncomesResponse, Income } from "@/types/income";
import { isoDateString, paginationSchema, uuidString } from "./common";

/**
 * 지출, 수입 응답 스키마 (ADR-F42)
 *
 * 백엔드 `ExpenseResponse`, `IncomeResponse` 와 맞춘다.
 * Jackson 은 null 필드도 키를 남겨 보내므로 null 이 오는 필드는 `.nullable()` 이다.
 * `amount` 는 `BigDecimal` 이 JSON 숫자로 직렬화된 값이다.
 * `satisfies` 로 기존 타입과 대조해, 어긋나면 tsc 가 실패한다.
 */

/** 백엔드 `CategoryInfo`. `icon` 은 DB 컬럼이 null 을 허용한다. */
export const categoryInfoSchema = z.object({
  uuid: uuidString,
  name: z.string(),
  color: z.string(),
  icon: z.string().nullable(),
}) satisfies z.ZodType<CategoryInfo>;

const transactionFields = {
  uuid: uuidString,
  familyUuid: uuidString,
  userUuid: uuidString,
  categoryUuid: uuidString,
  // 목록 조회에서 지출은 항상 null, 수입은 가족 카테고리에 없으면 null 이다.
  category: categoryInfoSchema.nullable(),
  amount: z.number(),
  description: z.string().nullable(),
  date: isoDateString,
  createdAt: isoDateString,
  updatedAt: isoDateString,
};

export const expenseSchema = z.object({
  ...transactionFields,
  excludeFromBudget: z.boolean(),
}) satisfies z.ZodType<Expense>;

export const incomeSchema = z.object(transactionFields) satisfies z.ZodType<Income>;

export const getExpensesResponseSchema = paginationSchema(
  expenseSchema
) satisfies z.ZodType<GetExpensesResponse>;

export const getIncomesResponseSchema = paginationSchema(
  incomeSchema
) satisfies z.ZodType<GetIncomesResponse>;
