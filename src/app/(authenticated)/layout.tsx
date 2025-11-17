/**
 * Authenticated Layout
 *
 * 인증이 필요한 모든 페이지를 감싸는 Layout입니다.
 * 로그인하지 않은 사용자는 자동으로 로그인 페이지로 리다이렉트됩니다.
 */

import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TimeZoneProvider } from "@/lib/client/timezone-context";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // 세션에서 프로필 정보 가져오기 (기본값: Asia/Seoul)
  const timezone = session.user.profile?.timezone || "Asia/Seoul";

  return (
    <TimeZoneProvider timezone={timezone}>
      <AppLayout initialSession={session}>{children}</AppLayout>
    </TimeZoneProvider>
  );
}
