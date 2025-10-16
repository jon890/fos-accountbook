/**
 * Dashboard Client Component
 * 클라이언트 사이드 상호작용이 필요한 부분만 분리
 */

"use client";

import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { Header } from "@/components/layout/Header";
import type { RecentExpense } from "@/types/actions";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { DashboardTabs } from "./DashboardTabs";

interface DashboardClientProps {
  children: React.ReactNode;
  initialSession: Session;
  recentExpenses: RecentExpense[];
}

export function DashboardClient({
  children,
  initialSession,
  recentExpenses,
}: DashboardClientProps) {
  const { data: session } = useSession();
  const currentSession = session || initialSession;

  return (
    <div
      className="min-h-screen"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f8fafc 0%, rgba(59, 130, 246, 0.1) 50%, rgba(99, 102, 241, 0.1) 100%)",
      }}
    >
      <Header session={currentSession} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {children}
        <DashboardTabs recentExpenses={recentExpenses} />
      </main>

      <BottomNavigation />
    </div>
  );
}
