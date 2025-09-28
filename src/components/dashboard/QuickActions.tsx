'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Settings } from "lucide-react"

export function QuickActions() {
  const router = useRouter()

  const handleAddExpenseClick = () => {
    router.push('/expenses')
  }

  const handleCategoryClick = () => {
    // TODO: 카테고리 관리 페이지로 이동
    console.log('카테고리 관리 (미구현)')
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card 
        className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm"
        onClick={handleAddExpenseClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Plus className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">지출 추가</h3>
              <p className="text-gray-600 text-sm">새로운 지출 기록</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm"
        onClick={handleCategoryClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">카테고리</h3>
              <p className="text-gray-600 text-sm">분류 관리</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
