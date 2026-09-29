"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { setDefaultFamily } from "@/services/user/user-service";

/**
 * 기본 가족 설정 Server Action
 * UserProfile의 defaultFamilyUuid를 업데이트
 *
 * ⚠️ 주의: 이 액션 호출 후 클라이언트에서 세션 갱신이 필요합니다.
 * useSessionRefresh 훅의 refreshSession()을 호출하세요.
 *
 * @example
 * ```tsx
 * const { refreshSession } = useSessionRefresh();
 *
 * const handleSetDefaultFamily = async (familyUuid: string) => {
 *   const result = await setDefaultFamilyAction(familyUuid);
 *   if (result.success) {
 *     await refreshSession(); // 세션 갱신
 *   }
 * };
 * ```
 */
export async function setDefaultFamilyAction(
  familyUuid: string
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    await setDefaultFamily(familyUuid);
    return successResult(undefined);
  } catch (error) {
    return handleActionError(error, "기본 가족 설정에 실패했습니다");
  }
}
