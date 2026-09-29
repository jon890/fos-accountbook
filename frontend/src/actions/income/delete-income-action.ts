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
import { deleteIncome } from "@/services/income/income-service";
import { revalidatePath } from "next/cache";

export async function deleteIncomeAction(
  familyUuid: string,
  incomeUuid: string
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

    if (!incomeUuid) {
      throw ActionError.invalidInput("incomeUuid", incomeUuid, "필수 값입니다");
    }

    await deleteIncome(familyUuid, incomeUuid);

    revalidatePath("/transactions");
    revalidatePath("/");
    revalidatePath("/analytics");

    return successResult(undefined);
  } catch (error) {
    return handleActionError(error, "수입 삭제에 실패했습니다");
  }
}
