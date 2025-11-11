/**
 * Dashboard Client Component
 * 클라이언트 사이드 상호작용이 필요한 부분만 분리
 */

"use client";

import type { RecentExpense } from "@/types/dashboard";
import { QuickActions } from "./QuickActions";
import { RecentActivity } from "./RecentActivity";

interface DashboardClientProps {
  children: React.ReactNode;
  recentExpenses: RecentExpense[];
}

export function DashboardClient({
  children,
  recentExpenses,
}: DashboardClientProps) {
  return (
    <>
      {children}
      <div className="space-y-4 md:space-y-6 mb-4 md:mb-8">
        <QuickActions />
        <RecentActivity expenses={recentExpenses} />
      </div>
    </>
  );
}
