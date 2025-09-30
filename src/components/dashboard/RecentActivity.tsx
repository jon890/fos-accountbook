import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wallet, Plus, ShoppingBag, Coffee, Home, Car, Heart, Gift, Utensils } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import type { RecentExpense } from "@/app/actions/dashboard-actions"

interface RecentActivityProps {
  expenses: RecentExpense[]
}

// 카테고리 아이콘 매핑
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  shopping: ShoppingBag,
  food: Utensils,
  coffee: Coffee,
  home: Home,
  transport: Car,
  health: Heart,
  gift: Gift,
  default: Wallet,
}

function getCategoryIcon(iconName: string) {
  const IconComponent = categoryIcons[iconName.toLowerCase()] || categoryIcons.default
  return IconComponent
}

export function RecentActivity({ expenses }: RecentActivityProps) {
  const hasExpenses = expenses.length > 0

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900">최근 활동</CardTitle>
          <Badge variant="secondary" className="bg-gray-100">
            {expenses.length}건
          </Badge>
        </div>
        <CardDescription>
          최근 추가된 지출 내역을 확인하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasExpenses ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">아직 지출 내역이 없습니다</h3>
            <p className="text-gray-500 mb-6">첫 번째 지출을 추가해보세요!</p>
            <Link href="/expenses">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl px-8">
                <Plus className="w-5 h-5 mr-2" />
                첫 지출 추가하기
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => {
              const IconComponent = getCategoryIcon(expense.category.icon)
              return (
                <div
                  key={expense.uuid}
                  className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                      style={{ 
                        backgroundColor: `${expense.category.color}20`,
                      }}
                    >
                      <div style={{ color: expense.category.color }}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {expense.description || expense.category.name}
                        </h4>
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                          style={{ 
                            backgroundColor: `${expense.category.color}15`,
                            color: expense.category.color,
                            border: 'none'
                          }}
                        >
                          {expense.category.name}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {format(new Date(expense.date), 'M월 d일 (E) HH:mm', { locale: ko })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      -₩{Number(expense.amount).toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            })}
            
            {expenses.length >= 10 && (
              <div className="pt-4">
                <Link href="/expenses">
                  <Button 
                    variant="outline" 
                    className="w-full border-2 border-gray-200 hover:bg-gray-50 rounded-2xl"
                  >
                    모든 지출 내역 보기
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}