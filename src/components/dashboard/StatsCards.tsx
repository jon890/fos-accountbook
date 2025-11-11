import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  TrendingUp,
  Users,
} from "lucide-react";

interface StatsData {
  monthlyExpense: number;
  monthlyIncome: number;
  remainingBudget: number;
  familyMembers: number;
  budget: number;
}

interface StatsCardsProps {
  data: StatsData;
}

export function StatsCards({ data }: StatsCardsProps) {
  // 예산 대비 지출 비율 계산
  const expenseRatio =
    data.budget > 0 ? (data.monthlyExpense / data.budget) * 100 : 0;
  const budgetUsagePercent = Math.min(Math.round(expenseRatio), 100);

  // 남은 예산 비율 계산
  const remainingRatio =
    data.budget > 0 ? (data.remainingBudget / data.budget) * 100 : 100;
  const remainingPercent = Math.max(Math.round(remainingRatio), 0);

  // 예산 초과 여부
  const isBudgetExceeded = data.remainingBudget < 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-8">
      {/* Monthly Expense Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white border-0 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <CardContent className="relative p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="p-2 md:p-3 bg-white/20 rounded-xl md:rounded-2xl backdrop-blur-sm">
              <TrendingUp className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-blue-200" />
          </div>
          <div>
            <p className="text-blue-100 text-xs md:text-sm font-medium mb-0.5 md:mb-1">
              이번 달 지출
            </p>
            <p className="text-xl md:text-3xl font-bold mb-1.5 md:mb-2">
              ₩{data.monthlyExpense.toLocaleString()}
            </p>
            <div className="flex items-center space-x-2">
              <Progress
                value={budgetUsagePercent}
                className="flex-1 h-1.5 md:h-2 bg-white/20"
              />
              <span className="text-[10px] md:text-xs text-blue-200">
                {budgetUsagePercent}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Income Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-600 to-green-700 text-white border-0 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <CardContent className="relative p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="p-2 md:p-3 bg-white/20 rounded-xl md:rounded-2xl backdrop-blur-sm">
              <TrendingUp className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-green-200" />
          </div>
          <div>
            <p className="text-green-100 text-xs md:text-sm font-medium mb-0.5 md:mb-1">
              이번 달 수입
            </p>
            <p className="text-xl md:text-3xl font-bold mb-1.5 md:mb-2">
              ₩{data.monthlyIncome.toLocaleString()}
            </p>
            <p className="text-[10px] md:text-xs text-green-200">
              순수익: ₩
              {(data.monthlyIncome - data.monthlyExpense).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Remaining Budget Card */}
      <Card
        className={`relative overflow-hidden ${
          isBudgetExceeded
            ? "bg-gradient-to-br from-red-500 via-red-600 to-red-700"
            : "bg-gradient-to-br from-amber-500 via-orange-600 to-orange-700"
        } text-white border-0 shadow-xl`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <CardContent className="relative p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="p-2 md:p-3 bg-white/20 rounded-xl md:rounded-2xl backdrop-blur-sm">
              <PiggyBank className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            {isBudgetExceeded ? (
              <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-2 py-0.5">
                초과
              </Badge>
            ) : (
              <ArrowDownRight className="w-4 h-4 md:w-5 md:h-5 text-green-200" />
            )}
          </div>
          <div>
            <p className="text-orange-100 text-xs md:text-sm font-medium mb-0.5 md:mb-1">
              {isBudgetExceeded ? "예산 초과" : "예산 남은 금액"}
            </p>
            <p className="text-xl md:text-3xl font-bold mb-1.5 md:mb-2">
              ₩
              {isBudgetExceeded
                ? Math.abs(data.remainingBudget).toLocaleString()
                : data.remainingBudget.toLocaleString()}
            </p>
            {data.budget > 0 ? (
              <div className="flex items-center space-x-2">
                <Progress
                  value={isBudgetExceeded ? 100 : remainingPercent}
                  className="flex-1 h-1.5 md:h-2 bg-white/20"
                />
                <span className="text-[10px] md:text-xs text-orange-200">
                  {isBudgetExceeded ? 0 : remainingPercent}%
                </span>
              </div>
            ) : (
              <p className="text-[10px] md:text-xs text-orange-200">
                예산 미설정
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Family Members Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 text-white border-0 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <CardContent className="relative p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="p-2 md:p-3 bg-white/20 rounded-xl md:rounded-2xl backdrop-blur-sm">
              <Users className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs px-2 py-0.5">
              활성
            </Badge>
          </div>
          <div>
            <p className="text-purple-100 text-xs md:text-sm font-medium mb-0.5 md:mb-1">
              가족 구성원
            </p>
            <p className="text-xl md:text-3xl font-bold mb-1.5 md:mb-2">
              {data.familyMembers}명
            </p>
            <p className="text-[10px] md:text-xs text-purple-200">
              관리자 권한
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
