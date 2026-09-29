"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { getIncomes } from "@/services/income/income-service";
import type { GetIncomesParams, GetIncomesResponse } from "@/types/income";

/**
 * 수입 목록 조회 Server Action
 */
export async function getIncomesAction(
  params: GetIncomesParams
): Promise<ActionResult<GetIncomesResponse>> {
  try {
    await requireAuth();
    const familyUuid = params.familyUuid || (await getSelectedFamilyUuid());
    if (!familyUuid) {
      return handleActionError(
        new Error("가족이 선택되지 않았습니다"),
        "수입 목록 조회에 실패했습니다"
      );
    }
    return successResult(await getIncomes(familyUuid, params));
  } catch (error) {
    return handleActionError(error, "수입 목록 조회에 실패했습니다");
  }
}
