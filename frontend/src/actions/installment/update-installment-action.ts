/**
 * 할부 수정 Server Action
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
import { updateInstallment } from "@/services/installment/installment-service";
import type { Installment, InstallmentInput } from "@/types/installment";
import { revalidatePath } from "next/cache";
import { parseInstallmentInput, parseInstallmentUuid } from "./_helpers";

export async function updateInstallmentAction(
  installmentUuid: string,
  data: InstallmentInput,
): Promise<ActionResult<Installment>> {
  try {
    await requireAuth();

    const validUuid = parseInstallmentUuid(installmentUuid);
    const validData = parseInstallmentInput(data);

    // ADR-F25 패턴 A: Single-family — 세션의 가족만 쓴다
    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    const installment = await updateInstallment(
      familyUuid,
      validUuid,
      validData,
    );

    revalidatePath("/transactions");

    return successResult(installment);
  } catch (error) {
    return handleActionError(error, "할부 수정에 실패했습니다");
  }
}
