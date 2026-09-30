"use client";

import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/utils/format";
import type { ChartEntry } from "./BudgetCumulativeLineChart";

interface BudgetCumulativeLineProps {
  dailyExpenses: { date: string; income: number; expense: number }[];
  budget: number;
  daysInMonth: number;
}

const BudgetCumulativeLineChart = dynamic(
  () => import("./BudgetCumulativeLineChart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 md:h-64">
        <div className="ab-skel [--skel-h:100%]" />
      </div>
    ),
  },
);

export function BudgetCumulativeLine({
  dailyExpenses,
  budget,
  daysInMonth,
}: BudgetCumulativeLineProps) {
  // 일자별 expense 맵 (missing 날은 0 보간)
  const expenseByDay = new Map<number, number>();
  for (const item of dailyExpenses) {
    const day = new Date(item.date).getDate();
    expenseByDay.set(day, item.expense);
  }

  const chartData: ChartEntry[] = [];
  let cumulative = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const daily = expenseByDay.get(day) ?? 0;
    cumulative += daily;
    chartData.push({
      day,
      cumulative,
      dailyExpense: daily,
      exceeded: cumulative >= budget,
    });
  }

  const lastEntry = chartData[chartData.length - 1];
  const totalCumulative = lastEntry?.cumulative ?? 0;
  let pct = 0;
  if (budget > 0) {
    pct = Math.min(Math.round((totalCumulative / budget) * 100), 100);
  }

  return (
    <div className="bg-bg-elev border border-border rounded-2xl p-5 md:p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-fg">이번 달 누적 지출</p>
        <div className="flex items-center gap-3 text-xs text-fg-muted">
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-0.5 rounded"
              style={{ backgroundColor: "var(--color-brand-500)" }}
            />
            누적
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-3 border-t border-dashed"
              style={{ borderColor: "var(--color-brand-700)" }}
            />
            예산
          </span>
        </div>
      </div>

      {/* 차트 */}
      <div className="h-48 md:h-64">
        <BudgetCumulativeLineChart chartData={chartData} budget={budget} />
      </div>

      {/* 하단 요약 */}
      <p className="mt-3 text-xs text-fg-muted text-right">
        오늘까지{" "}
        <span className="num font-semibold text-fg">
          {formatCurrency(totalCumulative)}
        </span>{" "}
        ({pct}%)
      </p>
    </div>
  );
}
