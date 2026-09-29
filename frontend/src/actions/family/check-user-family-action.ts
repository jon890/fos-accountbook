/**
 * 가족 정보 존재 여부 확인 Server Action
 * 여러 페이지에서 공통으로 사용되는 유틸리티 함수
 */

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
import { getFamilies } from "@/services/family/family-service";

export async function checkUserFamilyAction(): Promise<
  ActionResult<{ hasFamily: boolean; familyId?: string }>
> {
  try {
    await requireAuth();

    const families = await getFamilies().catch(() => null);
    if (!families || families.length === 0) {
      return successResult({ hasFamily: false });
    }

    let selectedFamilyUuid = await getSelectedFamilyUuid();
    if (!selectedFamilyUuid) {
      selectedFamilyUuid = families[0].uuid;
    }

    return successResult({ hasFamily: true, familyId: selectedFamilyUuid });
  } catch (error) {
    return handleActionError(error, "가족 정보 확인에 실패했습니다");
  }
}
