import { ActionError, ErrorCode } from "@/lib/errors";
import { businessError } from "@/lib/errors/action-error";
import { budgetItemInputSchema } from "@/lib/schemas/budget-item";
import { ServerApiError } from "@/lib/server/api/types";
import type { BudgetItemInput } from "@/types/budget-item";
import { z } from "zod";

const budgetItemUuidSchema = z.string().uuid();

/** 입력을 Zod 로 검증한다. 실패하면 첫 필드 문구로 ActionError(C001) 를 던진다. */
export function parseBudgetItemInput(data: BudgetItemInput): BudgetItemInput {
  const result = budgetItemInputSchema.safeParse(data);
  if (result.success) return result.data;

  const issue = result.error.issues[0];
  throw ActionError.invalidInput(
    String(issue?.path[0] ?? "unknown"),
    data,
    issue?.message ?? "입력값 검증에 실패했습니다",
  );
}

/** API 경로에 들어가는 항목 UUID 의 형식을 검증한다. */
export function parseBudgetItemUuid(budgetItemUuid: string): string {
  if (!budgetItemUuidSchema.safeParse(budgetItemUuid).success) {
    throw ActionError.invalidInput(
      "budgetItemUuid",
      budgetItemUuid,
      "UUID 형식이 올바르지 않습니다",
    );
  }
  return budgetItemUuid;
}

/**
 * 백엔드 409(이름 중복 BI004, 카테고리 충돌 BI002) 는 공용 handleActionError 가
 * 문구를 전달하지 않으므로, 백엔드 문구를 담은 ActionError 로 바꿔 던진다.
 */
export function rethrowBudgetItemConflict(error: unknown): never {
  if (error instanceof ServerApiError && error.status === 409) {
    const business = businessError(error.errorData);
    if (business) {
      throw new ActionError(
        ErrorCode.INVALID_INPUT,
        business.message,
      ).addParameter("backendCode", business.code);
    }
  }
  throw error;
}
