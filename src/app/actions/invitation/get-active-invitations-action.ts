/**
 * 활성 초대 링크 목록 조회 Server Action
 */

"use server";

import { serverEnv } from "@/lib/env/server.env";
import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiClient } from "@/lib/server/api/client";
import {
  getSelectedFamilyUuid,
  requireAuth,
} from "@/lib/server/auth/auth-helpers";
import type { FamilyResponse } from "@/types/family";
import type { InvitationInfo, InvitationResponse } from "@/types/invitation";

export async function getActiveInvitationsAction(): Promise<
  ActionResult<InvitationInfo[]>
> {
  try {
    // 인증 확인
    await requireAuth();

    // 선택된 가족 UUID 가져오기
    let familyUuid = await getSelectedFamilyUuid();

    // 선택된 가족이 없으면 첫 번째 가족 사용
    if (!familyUuid) {
      const familiesResponse = await serverApiClient<{
        data: FamilyResponse[];
      }>("/families", { method: "GET" });
      const families = familiesResponse.data;

      if (!families || families.length === 0) {
        throw ActionError.entityNotFound("가족");
      }

      familyUuid = families[0].uuid;
    }

    // 활성 초대 목록 조회
    const invitationsResponse = await serverApiClient<{
      data: InvitationResponse[];
    }>(`/invitations/families/${familyUuid}`, { method: "GET" });
    const invitations = invitationsResponse.data;

    const now = new Date();

    const invitationList: InvitationInfo[] = invitations.map((inv) => {
      const expiresAt = new Date(inv.expiresAt);
      return {
        uuid: inv.uuid,
        token: inv.token,
        expiresAt,
        createdAt: new Date(inv.createdAt),
        isExpired: now > expiresAt || inv.status === "EXPIRED",
        isUsed: inv.status === "ACCEPTED",
        inviteUrl: `${serverEnv.AUTH_URL}/invite/${inv.token}`,
      };
    });

    return successResult(invitationList);
  } catch (error) {
    console.error("Failed to get invitations:", error);
    return handleActionError(error, "초대 목록을 불러오는데 실패했습니다");
  }
}
