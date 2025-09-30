'use client'

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, BarChart3, Plus, CreditCard, Settings } from "lucide-react"
import { AddExpenseDialog } from "@/components/expenses/AddExpenseDialog"
import { cn } from "@/lib/utils"

export function BottomNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)

  const isActive = (path: string) => pathname === path

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 safe-area-pb">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around items-center h-16">
            {/* 홈 */}
            <Button
              variant="ghost"
              className={cn(
                "flex flex-col items-center space-y-1 h-auto py-2",
                isActive("/") ? "text-blue-600" : "text-gray-500"
              )}
              onClick={() => router.push("/")}
            >
              <Home className="w-5 h-5" />
              <span className={cn("text-xs", isActive("/") && "font-medium")}>
                홈
              </span>
            </Button>

            {/* 분석 */}
            <Button
              variant="ghost"
              className="flex flex-col items-center space-y-1 h-auto py-2 text-gray-500"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">분석</span>
            </Button>

            {/* 지출 추가 */}
            <div className="relative">
              <Button
                className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => setIsExpenseDialogOpen(true)}
              >
                <Plus className="w-6 h-6 text-white" />
              </Button>
            </div>

            {/* 내역 */}
            <Button
              variant="ghost"
              className={cn(
                "flex flex-col items-center space-y-1 h-auto py-2",
                isActive("/expenses") ? "text-blue-600" : "text-gray-500"
              )}
              onClick={() => router.push("/expenses")}
            >
              <CreditCard className="w-5 h-5" />
              <span className={cn("text-xs", isActive("/expenses") && "font-medium")}>
                내역
              </span>
            </Button>

            {/* 설정 */}
            <Button
              variant="ghost"
              className="flex flex-col items-center space-y-1 h-auto py-2 text-gray-500"
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs">설정</span>
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
  )
}
