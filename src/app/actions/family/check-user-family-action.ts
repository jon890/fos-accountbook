/**
 * 가족 정보 존재 여부 확인 Server Action
 * 여러 페이지에서 공통으로 사용되는 유틸리티 함수
 */

"use server";

import { auth } from "@/lib/server/auth";
import { getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { getFamiliesAction } from "./get-families-action";

export async function checkUserFamilyAction(): Promise<{
  hasFamily: boolean;
  familyId?: string;
}> {
  try {
    // 이 함수는 인증 체크를 직접 수행 (requireAuth를 사용하지 않음)
    // 인증되지 않았을 때 에러를 던지지 않고 hasFamily: false를 반환
    const session = await auth();

    if (!session?.user?.id) {
      return { hasFamily: false };
    }

    const familiesResult = await getFamiliesAction();

    if (
      !familiesResult.success ||
      !familiesResult.data ||
      familiesResult.data.length === 0
    ) {
      return { hasFamily: false };
    }

    // 선택된 가족 UUID 가져오기
    let selectedFamilyUuid = await getSelectedFamilyUuid();
    if (!selectedFamilyUuid) {
      selectedFamilyUuid = familiesResult.data[0].uuid;
    }

    return {
      hasFamily: true,
      familyId: selectedFamilyUuid,
    };
  } catch (error) {
    console.error("Failed to check family:", error);
    return { hasFamily: false };
  }
}
