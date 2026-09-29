"use client";

import { getDashboardStatsAction } from "@/actions/dashboard/get-dashboard-stats-action";
import { getMonthlyDailyStatsAction } from "@/actions/dashboard/get-monthly-daily-stats-action";
import { getExpensesAction } from "@/actions/expense/get-expenses-action";
import type { DailyTransactionSummary } from "@/actions/dashboard/get-monthly-daily-stats-action";
import type { DashboardStats } from "@/types/dashboard";
import type { Expense } from "@/types/expense";
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { startTransition, useState, useMemo } from "react";
import { AnalyticsPeriodToggle } from "./AnalyticsPeriodToggle";
import { AnalyticsCategoryDonut } from "./AnalyticsCategoryDonut";
import { MonthlyTrendBar } from "./MonthlyTrendBar";
import { CategoryDetailList } from "./CategoryDetailList";
import type { AnalyticsPeriod, CategoryBreakdownWithDelta, MonthlyTrend } from "@/types/analytics";

interface AnalyticsClientProps {
  initialYear: number;
  initialMonth: number;
  initialStats: DashboardStats | null;
  initialDailyStats: DailyTransactionSummary[];
  initialExpenses: Expense[];
  familyUuid: string;
  period: AnalyticsPeriod;
  initialBreakdown: CategoryBreakdownWithDelta | null;
  initialTrend: MonthlyTrend | null;
}

function formatAmount(amount: number) {
  return amount.toLocaleString("ko-KR");
}

function formatShortAmount(amount: number) {
  if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1)}억`;
  if (amount >= 10_000) return `${Math.floor(amount / 10_000)}만`;
  return `${amount.toLocaleString()}`;
}

const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

export function AnalyticsClient({
  initialYear,
  initialMonth,
  initialStats,
  initialDailyStats,
  initialExpenses,
  familyUuid,
  period,
  initialBreakdown,
  initialTrend,
}: AnalyticsClientProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [stats, setStats] = useState(initialStats);
  const [dailyStats, setDailyStats] = useState(initialDailyStats);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [isPending, setIsPending] = useState(false);

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth() + 1;
  }, [year, month]);

  const handleMonthChange = (direction: "prev" | "next") => {
    let newYear = year;
    let newMonth = month + (direction === "next" ? 1 : -1);

    if (newMonth === 0) { newMonth = 12; newYear -= 1; }
    if (newMonth === 13) { newMonth = 1; newYear += 1; }

    // 미래 이동 차단
    const now = new Date();
    if (newYear > now.getFullYear() || (newYear === now.getFullYear() && newMonth > now.getMonth() + 1)) return;

    setIsPending(true);
    startTransition(async () => {
      const start = `${newYear}-${String(newMonth).padStart(2, "0")}-01`;
      const lastDay = new Date(newYear, newMonth, 0).getDate();
      const end = `${newYear}-${String(newMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const now = new Date();
      const isNewCurrentMonth = newYear === now.getFullYear() && newMonth === now.getMonth() + 1;

      try {
        const [daily, exps, dashboardStats] = await Promise.all([
          getMonthlyDailyStatsAction(newYear, newMonth),
          getExpensesAction({ familyUuid: familyUuid, startDate: start, endDate: end, limit: 1000 }),
          isNewCurrentMonth ? getDashboardStatsAction() : Promise.resolve(null),
        ]);

        setYear(newYear);
        setMonth(newMonth);
        setDailyStats(daily.success ? daily.data : []);
        setExpenses(exps.success ? exps.data.items : []);
        if (isNewCurrentMonth) {
          setStats(dashboardStats && dashboardStats.success ? dashboardStats.data : null);
        } else {
          setStats(null);
        }
      } catch {
        toast.error("데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsPending(false);
      }
    });
  };


  const totalExpense = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount), 0),
    [expenses]
  );
  const totalIncome = useMemo(
    () => dailyStats.reduce((s, d) => s + d.income, 0),
    [dailyStats]
  );

  // 지출 TOP 5
  const topExpenses = useMemo(
    () => [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5),
    [expenses]
  );

  const budget = isCurrentMonth ? (stats?.budget ?? 0) : 0;
  const remainingBudget = isCurrentMonth ? (stats?.remainingBudget ?? 0) : 0;

  const now = new Date();
  const isNextDisabled =
    year > now.getFullYear() ||
    (year === now.getFullYear() && month >= now.getMonth() + 1);

  return (
    <div className={`space-y-4 transition-opacity duration-200 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      {/* 헤더: 기간 토글 + 월 선택기 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-fg">분석</h1>
          <AnalyticsPeriodToggle period={period} />
        </div>
        <div className="flex items-center gap-2 bg-bg-elev rounded-xl border border-border shadow-[var(--shadow-subtle)] px-1 py-1">
          <button
            onClick={() => handleMonthChange("prev")}
            className="p-1.5 rounded-lg hover:bg-bg-muted transition-colors text-fg-muted hover:text-fg"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-fg min-w-[72px] text-center">
            {year}년 {MONTH_NAMES[month - 1]}
          </span>
          <button
            onClick={() => handleMonthChange("next")}
            disabled={isNextDisabled}
            className="p-1.5 rounded-lg hover:bg-bg-muted transition-colors text-fg-muted hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 요약 카드 3개 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="gradient-expense rounded-2xl p-3 text-expense-fg">
          <div className="flex items-center gap-1 mb-2 opacity-80">
            <TrendingDown className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">지출</span>
          </div>
          <p className="text-base font-bold leading-tight">
            ₩{formatShortAmount(totalExpense)}
          </p>
        </div>
        <div className="gradient-income rounded-2xl p-3 text-income-fg">
          <div className="flex items-center gap-1 mb-2 opacity-80">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">수입</span>
          </div>
          <p className="text-base font-bold leading-tight">
            ₩{formatShortAmount(totalIncome)}
          </p>
        </div>
        <div className="gradient-budget rounded-2xl p-3 text-brand-fg">
          <div className="flex items-center gap-1 mb-2 opacity-80">
            <Wallet className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">{isCurrentMonth ? "잔여예산" : "예산"}</span>
          </div>
          <p className="text-base font-bold leading-tight">
            {isCurrentMonth && budget > 0
              ? `₩${formatShortAmount(remainingBudget)}`
              : <span className="text-sm opacity-70">-</span>}
          </p>
        </div>
      </div>

      {/* 카테고리 분포 + 월별 추이 (plan006) */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-4">
        {initialBreakdown ? (
          <AnalyticsCategoryDonut breakdown={initialBreakdown} />
        ) : (
          <div className="bg-bg-elev rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-default)]">
            <div className="h-24 flex items-center justify-center text-fg-subtle text-sm">
              카테고리 분포를 불러오지 못했습니다
            </div>
          </div>
        )}
        {initialTrend ? (
          <MonthlyTrendBar trend={initialTrend} />
        ) : (
          <div className="bg-bg-elev rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-default)]">
            <div className="h-24 flex items-center justify-center text-fg-subtle text-sm">
              월별 추이를 불러오지 못했습니다
            </div>
          </div>
        )}
      </div>

      {/* 카테고리 상세 (progress + 전월 delta) */}
      {initialBreakdown && initialBreakdown.items.length > 0 && (
        <CategoryDetailList
          items={initialBreakdown.items}
          totalExpense={initialBreakdown.totalExpense}
        />
      )}

      {/* 지출 TOP 5 */}
      {topExpenses.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
          <h2 className="text-sm font-bold text-gray-700 mb-3">지출 TOP 5</h2>
          <div className="space-y-2.5">
            {topExpenses.map((expense, idx) => (
              <div key={expense.uuid} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-400 flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                  style={{ backgroundColor: expense.category?.color ? `${expense.category.color}20` : "var(--color-category-fallback-bg)" }}
                >
                  {expense.category?.icon ?? "💸"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {expense.description || expense.category?.name || "기타"}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {expense.description ? `${expense.category?.name ?? "기타"} · ` : ""}
                    {expense.date.split("T")[0]}
                  </p>
                </div>
                <p className="text-sm font-bold text-expense shrink-0">
                  -₩{formatAmount(Number(expense.amount))}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
