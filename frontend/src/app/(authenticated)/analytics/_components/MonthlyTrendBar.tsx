"use client";

import { cn } from "@/lib/client/utils";
import type { MonthlyTrend } from "@/types/analytics";

interface MonthlyTrendBarProps {
  trend: MonthlyTrend;
}

function formatShortAmount(amount: number): string {
  if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1)}억`;
  if (amount >= 10_000) return `${Math.round(amount / 10_000)}만`;
  return amount.toLocaleString("ko-KR");
}

export function MonthlyTrendBar({ trend }: MonthlyTrendBarProps) {
  const { points, average } = trend;
  const max = Math.max(...points.map((p) => p.totalExpense), 1);

  return (
    <div className="bg-bg-elev rounded-[var(--radius-xl)] p-4 md:p-6 shadow-[var(--shadow-default)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-fg">월별 지출 추이</h2>
        {average > 0 && (
          <span className="hidden md:inline text-xs text-fg-muted">
            평균 ₩{formatShortAmount(average)}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-1.5 h-[140px] md:h-[180px]">
        {points.map((point, idx) => {
          const isLast = idx === points.length - 1;
          const heightPct = Math.max(2, (point.totalExpense / max) * 100);
          return (
            <div key={`${point.year}-${point.month}`} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <span
                className={cn(
                  "hidden md:block text-[10px] text-brand-700",
                  isLast ? "font-bold" : "font-medium text-fg-muted",
                )}
              >
                {point.totalExpense > 0 ? `₩${formatShortAmount(point.totalExpense)}` : ""}
              </span>
              <div
                className={cn(
                  "w-full rounded-t-md transition-all",
                  isLast ? "bg-brand-500" : "bg-brand-100",
                )}
                style={{ height: `${heightPct}%` }}
                aria-label={`${point.year}년 ${point.month}월 지출 ${formatShortAmount(point.totalExpense)}`}
              />
              <span
                className={cn(
                  "text-[10px] md:text-xs whitespace-nowrap",
                  isLast ? "font-bold text-fg" : "font-medium text-fg-muted",
                )}
              >
                {point.month}월
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
