'use client'

import { Button } from "@/components/ui/button"
import { Home, BarChart3, Plus, CreditCard, Settings } from "lucide-react"

export function BottomNavigation() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 safe-area-pb">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          <Button variant="ghost" className="flex flex-col items-center space-y-1 h-auto py-2 text-blue-600">
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">홈</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 h-auto py-2 text-gray-500">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs">분석</span>
          </Button>
          <div className="relative">
            <Button className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-6 h-6 text-white" />
            </Button>
          </div>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 h-auto py-2 text-gray-500">
            <CreditCard className="w-5 h-5" />
            <span className="text-xs">내역</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 h-auto py-2 text-gray-500">
            <Settings className="w-5 h-5" />
            <span className="text-xs">설정</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
