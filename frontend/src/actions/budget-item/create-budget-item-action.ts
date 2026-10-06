/**
 * 예산 항목 생성 Server Action
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
import { createBudgetItem } from "@/services/budget-item/budget-item-service";
import type { BudgetItem, BudgetItemInput } from "@/types/budget-item";
import { revalidatePath } from "next/cache";
import { parseBudgetItemInput, rethrowBudgetItemConflict } from "./_helpers";

export async function createBudgetItemAction(
  data: BudgetItemInput,
): Promise<ActionResult<BudgetItem>> {
  try {
    await requireAuth();

    const validData = parseBudgetItemInput(data);

    // ADR-F25 패턴 A: Single-family — 세션의 가족만 쓴다
    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    const item = await createBudgetItem(familyUuid, validData).catch(
      rethrowBudgetItemConflict,
    );

    revalidatePath("/budget");
    revalidatePath("/calendar");
    revalidatePath("/analytics");

    return successResult(item);
  } catch (error) {
    return handleActionError(error, "예산 항목 생성에 실패했습니다");
  }
}
