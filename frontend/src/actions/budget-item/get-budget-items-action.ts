/**
 * 예산 항목 목록 조회 Server Action
 */

"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { getBudgetItems } from "@/services/budget-item/budget-item-service";
import type { BudgetItem } from "@/types/budget-item";

export async function getBudgetItemsAction(): Promise<
  ActionResult<BudgetItem[]>
> {
  try {
    await requireAuth();

    // ADR-F25 패턴 A: Single-family — 세션의 가족만 쓴다
    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    return successResult(await getBudgetItems(familyUuid));
  } catch (error) {
    return handleActionError(error, "예산 항목을 불러오는데 실패했습니다");
  }
}
