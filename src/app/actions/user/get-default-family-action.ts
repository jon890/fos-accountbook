"use server";

import { getUserProfileAction } from "./get-user-profile-action";
import {
  successResult,
  handleActionError,
  type ActionResult,
} from "@/lib/errors";

/**
 * 기본 가족 조회 Server Action
 * getUserProfileAction을 사용하여 프로필에서 defaultFamilyUuid 추출
 *
 * @deprecated getUserProfileAction()을 직접 사용하는 것을 권장합니다
 */
export async function getDefaultFamilyAction(): Promise<
  ActionResult<string | null>
> {
  try {
    // UserProfile에서 기본 가족 UUID 조회
    const profileResult = await getUserProfileAction();

    if (!profileResult.success) {
      return profileResult;
    }

    return successResult(profileResult.data.defaultFamilyUuid);
  } catch (error) {
    console.error("기본 가족 조회 실패:", error);
    return handleActionError(error, "기본 가족 조회에 실패했습니다");
  }
}
