"use client";

import { AddExpenseDialog } from "@/components/expenses/AddExpenseDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart3, CreditCard, Home, Plus, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 safe-area-pb">
        <div className="max-w-7xl mx-auto px-2 md:px-4">
          <div className="flex justify-around items-center h-14 md:h-16">
            {/* 홈 */}
            <Button
              variant="ghost"
              className={cn(
                "flex flex-col items-center space-y-0.5 md:space-y-1 h-auto py-1.5 md:py-2",
                isActive("/") ? "text-blue-600" : "text-gray-500"
              )}
              onClick={() => router.push("/")}
            >
              <Home className="w-4.5 h-4.5 md:w-5 md:h-5" />
              <span
                className={cn(
                  "text-[10px] md:text-xs",
                  isActive("/") && "font-medium"
                )}
              >
                홈
              </span>
            </Button>

            {/* 분석 */}
            <Button
              variant="ghost"
              className="flex flex-col items-center space-y-0.5 md:space-y-1 h-auto py-1.5 md:py-2 text-gray-500"
            >
              <BarChart3 className="w-4.5 h-4.5 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-xs">분석</span>
            </Button>

            {/* 지출 추가 */}
            <div className="relative -mt-4 md:-mt-6">
              <Button
                className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => setIsExpenseDialogOpen(true)}
              >
                <Plus className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </Button>
            </div>

            {/* 내역 */}
            <Button
              variant="ghost"
              className={cn(
                "flex flex-col items-center space-y-0.5 md:space-y-1 h-auto py-1.5 md:py-2",
                isActive("/expenses") ? "text-blue-600" : "text-gray-500"
              )}
              onClick={() => router.push("/expenses")}
            >
              <CreditCard className="w-4.5 h-4.5 md:w-5 md:h-5" />
              <span
                className={cn(
                  "text-[10px] md:text-xs",
                  isActive("/expenses") && "font-medium"
                )}
              >
                내역
              </span>
            </Button>

            {/* 설정 */}
            <Button
              variant="ghost"
              className={cn(
                "flex flex-col items-center space-y-0.5 md:space-y-1 h-auto py-1.5 md:py-2",
                isActive("/settings") ? "text-blue-600" : "text-gray-500"
              )}
              onClick={() => router.push("/settings")}
            >
              <Settings className="w-4.5 h-4.5 md:w-5 md:h-5" />
              <span
                className={cn(
                  "text-[10px] md:text-xs",
                  isActive("/settings") && "font-medium"
                )}
              >
                설정
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* 지출 추가 다이얼로그 */}
      <AddExpenseDialog
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
      />
    </>
  );
}
