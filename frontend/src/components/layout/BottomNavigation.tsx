"use client";

import { AddTransactionDialog } from "@/components/transactions/dialogs/AddTransactionDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/client/utils";
import type { LucideIcon } from "lucide-react";
import { BarChart3, CreditCard, Home, Plus, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface NavButtonProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function FAB({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="지출 추가"
      className="absolute bottom-[28px] left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-brand-500 text-brand-fg border-4 border-bg-elev shadow-[var(--shadow-fab)] flex items-center justify-center transition-all hover:bg-brand-600"
    >
      <Plus className="w-6 h-6" strokeWidth={2.4} />
    </button>
  );
}

function NavButton({ icon: Icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "flex flex-col items-center space-y-0.5 md:space-y-1 h-auto py-1.5 md:py-2",
        isActive ? "text-brand-600" : "text-fg-subtle"
      )}
      onClick={onClick}
    >
      <Icon className="w-4.5 h-4.5 md:w-5 md:h-5" strokeWidth={isActive ? 2 : 1.6} />
      <span className={cn("text-[10px] md:text-xs", isActive && "font-semibold")}>
        {label}
      </span>
    </Button>
  );
}

export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  // 내역 페이지 활성화 체크 (transactions, expenses 둘 다)
  const isTransactionsActive =
    pathname === "/transactions" || pathname === "/expenses";

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg-elev/95 backdrop-blur-xl border-t border-border safe-area-pb">
        <div className="relative max-w-7xl mx-auto px-2 md:px-4">
          <div className="flex justify-around items-center h-14 md:h-16">
            {/* 홈 */}
            <NavButton
              icon={Home}
              label="홈"
              isActive={isActive("/") || isActive("/dashboard")}
              onClick={() => router.push("/dashboard")}
            />

            {/* 내역 */}
            <NavButton
              icon={CreditCard}
              label="내역"
              isActive={isTransactionsActive}
              onClick={() => router.push("/transactions?tab=expenses")}
            />

            {/* center slot — FAB 위치 확보 */}
            <div className="flex-1" />

            {/* 분석 */}
            <NavButton
              icon={BarChart3}
              label="분석"
              isActive={isActive("/analytics")}
              onClick={() => router.push("/analytics")}
            />

            {/* 설정 */}
            <NavButton
              icon={Settings}
              label="설정"
              isActive={isActive("/settings")}
              onClick={() => router.push("/settings")}
            />
          </div>
          <FAB onClick={() => setIsExpenseDialogOpen(true)} />
        </div>
      </div>

      {/* 거래 추가 다이얼로그 */}
      <AddTransactionDialog
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        defaultType="expense"
      />
    </>
  );
}
