"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/client/utils";
import { formatCurrency } from "@/lib/utils/format";
import type { CategoryBreakdownItem } from "@/types/dashboard";
import { AlertTriangle, PiggyBank, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { BudgetCategoryBars } from "./BudgetCategoryBars";
import { BudgetCumulativeLine } from "./BudgetCumulativeLine";

interface BudgetClientProps {
  budget: number;
  monthlyExpense: number;
  remainingBudget: number;
  year: number;
  month: number;
  dailyExpenses: { date: string; income: number; expense: number }[];
  categoryItems: CategoryBreakdownItem[];
}

export function BudgetClient({
  budget,
  monthlyExpense,
  remainingBudget,
  year,
  month,
  dailyExpenses,
  categoryItems,
}: BudgetClientProps) {
  const router = useRouter();

  const isBudgetExceeded = remainingBudget < 0;
  const hasBudget = budget > 0;

  const usagePercent = hasBudget
    ? Math.min(Math.round((monthlyExpense / budget) * 100), 100)
    : 0;

  const remainingPercent = hasBudget
    ? Math.max(Math.round((remainingBudget / budget) * 100), 0)
    : 0;

  const today = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayOfMonth = today.getDate();
  const daysRemaining = Math.max(daysInMonth - dayOfMonth, 0);

  const dailyAverage =
    dayOfMonth > 0 ? Math.round(monthlyExpense / dayOfMonth) : 0;
  const recommendedDailyBudget =
    daysRemaining > 0
      ? Math.max(Math.round(remainingBudget / daysRemaining), 0)
      : 0;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-fg">예산 관리</h1>
          <p className="text-sm text-fg-muted mt-0.5">
            {year}년 {month}월
          </p>
        </div>
        <div className="p-3 gradient-budget rounded-xl shadow-md">
          <PiggyBank className="w-5 h-5 md:w-6 md:h-6 text-brand-fg" />
        </div>
      </div>

      {/* 예산 미설정 빈 상태 */}
      {!hasBudget && (
        <Card className="border-dashed border-2 border-border bg-bg-elev">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-brand-50 rounded-full mb-4">
              <PiggyBank className="w-8 h-8 text-brand-500 opacity-85" />
            </div>
            <p className="text-[17px] font-bold text-fg mb-1">
              예산이 설정되지 않았습니다
            </p>
            <p className="text-[13px] text-fg-muted mb-6">
              월별 예산을 설정하면 지출을 효과적으로 관리할 수 있어요
            </p>
            <Button
              variant="default"
              onClick={() => router.push("/settings")}
              className="gradient-budget text-brand-fg shadow-sm hover:opacity-90 transition-opacity"
            >
              <Settings className="w-4 h-4" />
              예산 설정하기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 예산 현황 카드 */}
      {hasBudget && (
        <Card
          className={cn(
            "relative overflow-hidden border-0 shadow-lg",
            isBudgetExceeded
              ? "gradient-expense text-expense-fg"
              : "gradient-budget text-brand-fg"
          )}
        >
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium gradient-card-label">
                {isBudgetExceeded ? "예산 초과" : "예산 남은 금액"}
              </p>
              {isBudgetExceeded && (
                <Badge className="gradient-card-overlay text-expense-fg border-0 text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  초과
                </Badge>
              )}
            </div>

            <p className="num text-4xl md:text-5xl font-bold mb-1">
              {isBudgetExceeded ? "-" : ""}
              {formatCurrency(Math.abs(remainingBudget))}
            </p>
            <p className="text-xs mb-4 gradient-card-sublabel">
              총 예산 {formatCurrency(budget)} / {daysRemaining}일 남음
            </p>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs gradient-card-sublabel">
                <span>사용률</span>
                <span>{usagePercent}%</span>
              </div>
              <Progress
                value={isBudgetExceeded ? 100 : usagePercent}
                className="h-2 gradient-card-overlay"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3-col 통계 단락 */}
      {hasBudget && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <Card className="bg-bg-elev border-border rounded-xl">
            <CardContent className="p-4">
              <p className="text-xs text-fg-muted mb-1">일 평균 지출</p>
              <p className="num text-xl md:text-2xl font-bold text-fg">
                {formatCurrency(dailyAverage)}
              </p>
              <p className="text-xs text-fg-muted mt-1">{dayOfMonth}일 기준</p>
            </CardContent>
          </Card>

          <Card className="bg-bg-elev border-border rounded-xl">
            <CardContent className="p-4">
              <p className="text-xs text-fg-muted mb-1">남은 일수</p>
              <p className="num text-xl md:text-2xl font-bold text-fg">
                {daysRemaining}일
              </p>
              <p className="text-xs text-fg-muted mt-1">{daysInMonth}일 중</p>
            </CardContent>
          </Card>

          <Card className="bg-bg-elev border-border rounded-xl">
            <CardContent className="p-4">
              <p className="text-xs text-fg-muted mb-1">권장 일 예산</p>
              <p className="num text-xl md:text-2xl font-bold text-fg">
                {formatCurrency(recommendedDailyBudget)}
              </p>
              <p className="text-xs text-fg-muted mt-1">
                남은 예산 ÷ 남은 일수
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 세부 내역 */}
      {hasBudget && (
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {/* 이번 달 지출 */}
          <Card className="bg-bg-elev border-border">
            <CardHeader className="pb-1 p-4">
              <CardTitle className="text-xs text-fg-muted font-medium">
                이번 달 지출
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-lg md:text-xl font-bold text-fg">
                {formatCurrency(monthlyExpense)}
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-fg-muted">
                  <span>예산 대비</span>
                  <span>{usagePercent}%</span>
                </div>
                <Progress value={usagePercent} className="h-1.5" />
              </div>
            </CardContent>
          </Card>

          {/* 남은 예산 */}
          <Card className="bg-bg-elev border-border">
            <CardHeader className="pb-1 p-4">
              <CardTitle className="text-xs text-fg-muted font-medium">
                {isBudgetExceeded ? "초과 금액" : "남은 예산"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p
                className={cn(
                  "text-lg md:text-xl font-bold",
                  isBudgetExceeded ? "text-expense" : "text-fg"
                )}
              >
                {isBudgetExceeded ? "-" : ""}
                {formatCurrency(Math.abs(remainingBudget))}
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-fg-muted">
                  <span>남은 비율</span>
                  <span>{isBudgetExceeded ? 0 : remainingPercent}%</span>
                </div>
                <Progress
                  value={isBudgetExceeded ? 0 : remainingPercent}
                  className="h-1.5"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 라인 차트 */}
      {hasBudget && (
        <BudgetCumulativeLine
          dailyExpenses={dailyExpenses}
          budget={budget}
          daysInMonth={daysInMonth}
        />
      )}

      {/* 카테고리 top 5 */}
      <BudgetCategoryBars items={categoryItems} budget={budget} />

      {/* 예산 수정 링크 */}
      {hasBudget && (
        <Button
          variant="outline"
          onClick={() => router.push("/settings")}
          className="w-full rounded-xl text-fg-muted"
        >
          <Settings className="w-4 h-4" />
          예산 수정하기
        </Button>
      )}
    </div>
  );
}
