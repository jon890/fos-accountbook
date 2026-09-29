"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import {
  getInvitationInfo,
  type InvitationInfoData,
} from "@/services/invitation/invitation-service";
import { InvitationTokenSchema } from "./_schemas";

export type { InvitationInfoData };

// 공개 액션: 로그인 전 초대 미리보기를 위해 requireAuth() 생략
// (service 내부에서 skipAuth: true 사용)
export async function getInvitationInfoAction(
  token: string
): Promise<ActionResult<InvitationInfoData>> {
  try {
    const { token: validToken } = InvitationTokenSchema.parse({ token });
    const info = await getInvitationInfo(validToken);
    return successResult(info);
  } catch (error) {
    return handleActionError(error, "초대 정보를 가져오는데 실패했습니다");
  }
}
