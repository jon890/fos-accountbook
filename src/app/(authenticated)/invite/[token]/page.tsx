/**
 * 초대 수락 페이지
 * /invite/[token] 경로로 접속
 */

import { getInvitationInfoAction } from "@/app/actions/invitation/get-invitation-info-action";
import { InvitePageClient } from "./_components/InvitePageClient";
import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  // Layout에서 이미 인증 체크 완료 ✅
  const session = await auth();
  if (!session) {
    // Layout에서 이미 체크했으니 도달하지 않음
    redirect(
      `/auth/signin?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`
    );
  }

  // 초대 정보 조회
  const result = await getInvitationInfoAction(token);

  // 유효하지 않은 초대인 경우 대시보드로 리다이렉트
  if (!result.success || !result.data.valid) {
    redirect("/?error=invalid_invitation");
  }

  return (
    <InvitePageClient
      token={token}
      familyName={result.data.familyName || ""}
      expiresAt={result.data.expiresAt!}
    />
  );
}
