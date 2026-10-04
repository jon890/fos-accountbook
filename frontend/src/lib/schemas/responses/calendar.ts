import { z } from "zod";
import type { DailyStatsWithMembers, MemberAmount } from "@/types/dashboard";
import { isoDateString, uuidString } from "./common";

/**
 * 달력 일별 통계 응답 스키마 (ADR-F42)
 *
 * 백엔드 `DailyStatsResponse`, `DailyStat`, `MemberAmount` 와 맞춘다.
 * 금액은 `BigDecimal` 이 JSON 숫자로 직렬화된 값이라 문자열을 받지 않는다.
 * 달력의 지출, 수입 목록은 같은 엔드포인트이므로 `transaction.ts` 의 목록 스키마를 쓴다.
 */

const memberAmountSchema = z.object({
  userUuid: uuidString,
  amount: z.number(),
}) satisfies z.ZodType<MemberAmount>;

export const dailyStatsResponseSchema = z.object({
  year: z.number(),
  month: z.number(),
  dailyStats: z.array(
    z.object({
      date: isoDateString,
      income: z.number(),
      expense: z.number(),
      memberExpenses: z.array(memberAmountSchema),
    })
  ),
  totalIncome: z.number(),
  totalExpense: z.number(),
}) satisfies z.ZodType<DailyStatsWithMembers>;
