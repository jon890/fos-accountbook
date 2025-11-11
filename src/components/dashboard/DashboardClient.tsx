/**
 * Dashboard Client Component
 * 클라이언트 사이드 상호작용이 필요한 부분만 분리
 */

"use client";

import type { RecentExpense } from "@/types/dashboard";
import { DashboardTabs } from "./DashboardTabs";

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
      <DashboardTabs recentExpenses={recentExpenses} />
    </>
  );
}
