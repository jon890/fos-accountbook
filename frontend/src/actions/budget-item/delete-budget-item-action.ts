/**
 * 예산 항목 삭제 Server Action
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
import { deleteBudgetItem } from "@/services/budget-item/budget-item-service";
import { revalidatePath } from "next/cache";
import { parseBudgetItemUuid } from "./_helpers";

export async function deleteBudgetItemAction(
  budgetItemUuid: string,
): Promise<ActionResult<void>> {
  try {
    await requireAuth();

    const validUuid = parseBudgetItemUuid(budgetItemUuid);

    // ADR-F25 패턴 A: Single-family — 세션의 가족만 쓴다
    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    await deleteBudgetItem(familyUuid, validUuid);

    revalidatePath("/budget");
    revalidatePath("/calendar");
    revalidatePath("/analytics");

    return successResult(undefined);
  } catch (error) {
    return handleActionError(error, "예산 항목 삭제에 실패했습니다");
  }
}
