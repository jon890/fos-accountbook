import { z } from "zod";
import type { MonthlyTrendPoint } from "@/types/analytics";
import { uuidString } from "./common";

/**
 * 대시보드 통계 응답 스키마 (ADR-F42)
 *
 * 분석과 대시보드 서비스가 같은 엔드포인트를 쓰므로 스키마를 여기 하나에 둔다.
 * 금액은 `BigDecimal` 이 JSON 숫자로 직렬화된 값이다.
 */

/**
 * 백엔드 `CategoryBreakdownResponse`, `CategoryBreakdownItem`.
 * `name`, `icon`, `color` 는 DTO 에서 null 을 허용하는 `String` 이다.
 * `deltaPercent` 는 `compareWithPrev=false` 이거나 직전 달 금액이 없으면 null 이다.
 */
export const categoryBreakdownResponseSchema = z.object({
  year: z.number(),
  month: z.number(),
  totalExpense: z.number(),
  items: z.array(
    z.object({
      categoryUuid: uuidString,
      name: z.string().nullable(),
      icon: z.string().nullable(),
      color: z.string().nullable(),
      totalAmount: z.number(),
      percentage: z.number(),
      deltaPercent: z.number().nullable(),
      // 직전 달 같은 카테고리 금액. 비교를 요청하지 않으면 null, 직전 달 지출이 없으면 0 이다.
      previousAmount: z.number().nullable(),
    })
  ),
});

export type CategoryBreakdownResponse = z.infer<
  typeof categoryBreakdownResponseSchema
>;

/** 백엔드 `MonthlyTrendResponse`, `MonthlyTrendPoint` */
export const monthlyTrendResponseSchema = z.object({
  points: z.array(
    z.object({
      year: z.number(),
      month: z.number(),
      totalExpense: z.number(),
    }) satisfies z.ZodType<MonthlyTrendPoint>
  ),
  average: z.number(),
});

export type MonthlyTrendResponse = z.infer<typeof monthlyTrendResponseSchema>;
