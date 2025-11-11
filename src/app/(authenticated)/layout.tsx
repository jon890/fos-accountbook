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
import { getUserProfileAction } from "@/app/actions/user/get-user-profile-action";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  // 모든 하위 페이지에서 자동으로 세션 체크
  const session = await auth();

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // 사용자 프로필에서 시간대 가져오기
  let timezone = "Asia/Seoul"; // 기본값
  try {
    const profileResult = await getUserProfileAction();
    if (profileResult.success && profileResult.data.timezone) {
      timezone = profileResult.data.timezone;
    }
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    // 실패 시 기본값 사용
  }

  // 인증된 사용자에게 공통 레이아웃 제공
  return (
    <TimeZoneProvider timezone={timezone}>
      <AppLayout initialSession={session}>{children}</AppLayout>
    </TimeZoneProvider>
  );
}
