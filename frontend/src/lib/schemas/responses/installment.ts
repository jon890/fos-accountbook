import { z } from "zod";
import type { Installment } from "@/types/installment";
import { isoDateString, uuidString } from "./common";

/**
 * 할부 응답 스키마 (ADR-F42)
 *
 * 백엔드 `InstallmentResponse` 와 맞춘다.
 * 금액은 `BigDecimal` 이 JSON 숫자로 직렬화된 값이라 문자열을 받지 않는다.
 */

export const installmentResponseSchema = z.object({
  uuid: uuidString,
  userUuid: uuidString,
  name: z.string(),
  totalAmount: z.number(),
  installmentMonths: z.number(),
  startMonth: z.string(),
  endMonth: z.string(),
  memo: z.string().nullable(),
  monthlyAmount: z.number(),
  firstMonthAmount: z.number(),
  currentRound: z.number(),
  thisMonthAmount: z.number(),
  remainingAmount: z.number(),
  progress: z.enum(["UPCOMING", "IN_PROGRESS", "COMPLETED"]),
  createdAt: isoDateString,
  updatedAt: isoDateString,
}) satisfies z.ZodType<Installment>;

export const installmentListResponseSchema = z.array(installmentResponseSchema);
