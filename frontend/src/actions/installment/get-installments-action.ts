/**
 * 할부 목록 조회 Server Action
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
import { getInstallments } from "@/services/installment/installment-service";
import type { Installment } from "@/types/installment";

export async function getInstallmentsAction(): Promise<
  ActionResult<Installment[]>
> {
  try {
    await requireAuth();

    // ADR-F25 패턴 A: Single-family — 세션의 가족만 쓴다
    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    return successResult(await getInstallments(familyUuid));
  } catch (error) {
    return handleActionError(error, "할부를 불러오는데 실패했습니다");
  }
}
