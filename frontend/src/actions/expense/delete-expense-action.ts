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
import { deleteExpense } from "@/services/expense/expense-service";
import { revalidatePath } from "next/cache";

export async function deleteExpenseAction(
  familyUuid: string,
  expenseUuid: string
): Promise<ActionResult<void>> {
  try {
    await requireAuth();

    const sessionFamilyUuid = await getSelectedFamilyUuid();
    if (!sessionFamilyUuid) {
      throw ActionError.familyNotSelected();
    }
    if (familyUuid !== sessionFamilyUuid) {
      throw ActionError.unauthorized("권한이 없습니다.");
    }

    if (!expenseUuid) {
      throw ActionError.invalidInput("expenseUuid", expenseUuid, "필수 값입니다");
    }

    await deleteExpense(familyUuid, expenseUuid);

    revalidatePath("/transactions");
    revalidatePath("/");
    revalidatePath("/analytics");

    return successResult(undefined);
  } catch (error) {
    return handleActionError(error, "지출 삭제에 실패했습니다");
  }
}
