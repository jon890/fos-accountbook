"use client";

import dynamic from "next/dynamic";
import { getCategoryTone } from "@/lib/utils/category-tone";
import { formatCurrency } from "@/lib/utils/format";
import type { CategoryBreakdownWithDelta } from "@/types/analytics";

interface AnalyticsCategoryDonutProps {
  breakdown: CategoryBreakdownWithDelta;
  topN?: number;
}

const AnalyticsCategoryDonutChart = dynamic(
  () => import("./AnalyticsCategoryDonutChart"),
  {
    ssr: false,
    loading: () => (
      <div className="w-[172px] h-[172px] md:w-[160px] md:h-[160px]">
        <div className="ab-skel [--skel-h:100%]" />
      </div>
    ),
  },
);

const MONTH_LABEL = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="text-[11px] text-fg-subtle">—</span>;
  }

  let color = "text-fg-muted";
  let arrow = "·";
  if (delta > 0) {
    color = "text-expense";
    arrow = "↑";
  } else if (delta < 0) {
    color = "text-income";
    arrow = "↓";
  }

  return (
    <span className={`text-[11px] font-semibold ${color}`}>
      {arrow} {Math.abs(delta)}%
    </span>
  );
}

export function AnalyticsCategoryDonut({
  breakdown,
  topN = 6,
}: AnalyticsCategoryDonutProps) {
  const { totalExpense, totalDelta, items, month } = breakdown;
  const isEmpty = items.length === 0;
  const topItems = items.slice(0, topN);

  return (
    <div className="bg-bg-elev rounded-[var(--radius-xl)] p-4 md:p-6 shadow-[var(--shadow-default)]">
      {isEmpty ? (
        <p className="text-sm text-fg-muted text-center py-8">이번 달 지출 없음</p>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start">
          <div className="relative shrink-0 w-[172px] h-[172px] md:w-[160px] md:h-[160px]">
            <AnalyticsCategoryDonutChart breakdown={breakdown} />

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-0.5">
              <span className="text-[11px] text-fg-muted">{MONTH_LABEL[month - 1]} 지출</span>
              <span className="num text-[22px] md:text-xl font-bold text-fg leading-tight">
                {formatCurrency(totalExpense)}
              </span>
              <DeltaBadge delta={totalDelta} />
            </div>
          </div>

          <div className="flex-1 w-full md:min-w-0 grid grid-cols-2 gap-2 md:flex md:flex-col md:gap-2.5">
            {topItems.map((item) => {
              const tone = getCategoryTone(item.name);
              return (
                <div key={item.categoryUuid} className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ background: tone.fg }}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium text-fg truncate flex-1">{item.name}</span>
                  <span className="num text-xs text-fg-muted shrink-0">{item.percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
