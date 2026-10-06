/**
 * 할부 관련 타입 (frontend/docs/data-schema.md 「Installment」)
 */

import { installmentInputSchema } from "@/lib/schemas/installment";
import z from "zod";

export type InstallmentProgress = "UPCOMING" | "IN_PROGRESS" | "COMPLETED";

export interface Installment {
  uuid: string;
  userUuid: string; // 등록한 사람
  name: string;
  totalAmount: number;
  installmentMonths: number; // 2~60
  startMonth: string; // YYYY-MM
  endMonth: string; // YYYY-MM
  memo: string | null;
  monthlyAmount: number;
  firstMonthAmount: number;
  currentRound: number; // 0 ~ installmentMonths
  thisMonthAmount: number;
  remainingAmount: number;
  progress: InstallmentProgress;
  createdAt: string;
  updatedAt: string;
}

/** 생성과 수정의 입력 */
export type InstallmentInput = z.infer<typeof installmentInputSchema>;
