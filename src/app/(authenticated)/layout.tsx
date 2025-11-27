/**
 * Authenticated Layout
 *
 * 인증이 필요한 모든 페이지를 감싸는 Layout입니다.
 * 로그인하지 않은 사용자는 자동으로 로그인 페이지로 리다이렉트됩니다.
 */

import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { Header } from "@/components/layout/Header";
import { TimeZoneProvider } from "@/lib/client/timezone-context";
import {
  getSelectedFamilyUuid,
  requireAuth,
} from "@/lib/server/auth/auth-helpers";
import { ReactNode } from "react";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const session = await requireAuth();
  const selectedFamilyUuid = await getSelectedFamilyUuid();
  const timezone = session.user.profile?.timezone ?? "Asia/Seoul";

  return (
    <TimeZoneProvider timezone={timezone}>
      <div
        className="min-h-screen"
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #f8fafc 0%, rgba(59, 130, 246, 0.1) 50%, rgba(99, 102, 241, 0.1) 100%)",
        }}
      >
        <Header session={session} selectedFamilyUuid={selectedFamilyUuid} />

        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-6 pb-20 md:pb-24">
          {children}
        </main>

        <BottomNavigation />
      </div>
    </TimeZoneProvider>
  );
}
