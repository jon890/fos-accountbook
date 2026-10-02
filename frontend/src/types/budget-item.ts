/**
 * 예산 항목 관련 타입 (frontend/docs/data-schema.md 「BudgetItem」)
 */

import { budgetItemInputSchema } from "@/lib/schemas/budget-item";
import z from "zod";

export interface BudgetItem {
  uuid: string;
  name: string;
  monthlyLimit: number; // 0 = 한도 없음
  categoryUuids: string[];
  createdAt: string;
  updatedAt: string;
}

/** 생성과 수정의 입력 */
export type BudgetItemInput = z.infer<typeof budgetItemInputSchema>;

/** GET /dashboard/budget-summary. 달력 홈이 쓴다 */
export interface BudgetSummary {
  year: number;
  month: number;
  living: { spent: number; limit: number }; // limit 0 = 월 예산 미설정
  items: Array<{
    budgetItemUuid: string;
    name: string;
    limit: number;
    spent: number;
  }>;
}
