/**
 * Authenticated Layout
 *
 * 인증이 필요한 모든 페이지를 감싸는 Layout입니다.
 * 로그인하지 않은 사용자는 자동으로 로그인 페이지로 리다이렉트됩니다.
 */

import { Header } from "@/components/layout/Header";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { TimeZoneProvider } from "@/lib/client/timezone-context";
import { auth } from "@/lib/server/auth";
import { getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { redirect } from "next/navigation";
import { ReactNode, Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const selectedFamilyUuid = await getSelectedFamilyUuid();
  const timezone = session.user.profile?.timezone ?? "Asia/Seoul";

  return (
    <TimeZoneProvider timezone={timezone}>
      <div className="min-h-screen bg-bg">
        <Header session={session} selectedFamilyUuid={selectedFamilyUuid} />

        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 md:pt-6 pb-[calc(4rem+env(safe-area-inset-bottom))]">
          {children}
        </main>

        <Suspense fallback={null}>
          <BottomNavigation />
        </Suspense>
      </div>
    </TimeZoneProvider>
  );
}
