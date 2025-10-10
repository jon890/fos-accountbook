/**
 * 초대 수락 페이지
 * /invite/[token] 경로로 접속
 */

import {
  getInvitationInfo
} from "@/app/actions/invitation-actions";
import { InvitePageClient } from "@/components/invite/InvitePageClient";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

interface InvitePageProps {
  params: {
    token: string;
  };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = params;

  // 세션 확인
  const session = await auth();

  // 로그인되지 않은 경우 로그인 페이지로 리다이렉트 (초대 링크 유지)
  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
  }

  // 초대 정보 조회
  const invitationInfo = await getInvitationInfo(token);

  // 유효하지 않은 초대인 경우 대시보드로 리다이렉트
  if (!invitationInfo.valid) {
    redirect("/?error=invalid_invitation");
  }

  return (
    <InvitePageClient
      token={token}
      familyName={invitationInfo.familyName || ""}
      expiresAt={invitationInfo.expiresAt!}
    />
  );
}
