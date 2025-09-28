import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, PiggyBank, Users, ArrowUpRight, ArrowDownRight } from "lucide-react"

interface StatsData {
  monthlyExpense: number
  remainingBudget: number
  familyMembers: number
}

interface StatsCardsProps {
  data: StatsData
}

export function StatsCards({ data }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Monthly Expense Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white border-0 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <p className="text-blue-100 text-sm font-medium mb-1">이번 달 지출</p>
            <p className="text-3xl font-bold mb-2">₩{data.monthlyExpense.toLocaleString()}</p>
            <div className="flex items-center space-x-2">
              <Progress value={0} className="flex-1 h-2 bg-white/20" />
              <span className="text-xs text-blue-200">0%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remaining Budget Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-600 to-green-700 text-white border-0 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <PiggyBank className="w-6 h-6" />
            </div>
            <ArrowDownRight className="w-5 h-5 text-green-200" />
          </div>
          <div>
            <p className="text-green-100 text-sm font-medium mb-1">예산 남은 금액</p>
            <p className="text-3xl font-bold mb-2">₩{data.remainingBudget.toLocaleString()}</p>
            <div className="flex items-center space-x-2">
              <Progress value={100} className="flex-1 h-2 bg-white/20" />
              <span className="text-xs text-green-200">100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family Members Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 text-white border-0 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Users className="w-6 h-6" />
            </div>
            <Badge className="bg-white/20 text-white border-0">활성</Badge>
          </div>
          <div>
            <p className="text-purple-100 text-sm font-medium mb-1">가족 구성원</p>
            <p className="text-3xl font-bold mb-2">{data.familyMembers}명</p>
            <p className="text-xs text-purple-200">관리자 권한</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
