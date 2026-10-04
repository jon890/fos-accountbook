/**
 * 할부 삭제 Server Action
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
import { deleteInstallment } from "@/services/installment/installment-service";
import { revalidatePath } from "next/cache";
import { parseInstallmentUuid } from "./_helpers";

export async function deleteInstallmentAction(
  installmentUuid: string,
): Promise<ActionResult<void>> {
  try {
    await requireAuth();

    const validUuid = parseInstallmentUuid(installmentUuid);

    // ADR-F25 패턴 A: Single-family — 세션의 가족만 쓴다
    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    await deleteInstallment(familyUuid, validUuid);

    revalidatePath("/transactions");

    return successResult(undefined);
  } catch (error) {
    return handleActionError(error, "할부 삭제에 실패했습니다");
  }
}
