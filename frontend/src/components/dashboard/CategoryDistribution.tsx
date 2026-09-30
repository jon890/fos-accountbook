"use client";

import dynamic from "next/dynamic";
import { getCategoryTone } from "@/lib/utils/category-tone";
import { formatCurrency } from "@/lib/utils/format";
import type { MonthlyCategoryBreakdown } from "@/types/dashboard";

interface CategoryDistributionProps {
  breakdown: MonthlyCategoryBreakdown;
}

const CategoryDistributionChart = dynamic(
  () => import("./CategoryDistributionChart"),
  {
    ssr: false,
    loading: () => (
      <div className="w-[120px] h-[120px] md:w-[180px] md:h-[180px]">
        <div className="ab-skel [--skel-h:100%]" />
      </div>
    ),
  },
);

export function CategoryDistribution({ breakdown }: CategoryDistributionProps) {
  const { totalExpense, items } = breakdown;
  const isEmpty = items.length === 0;

  // Show up to 5 on mobile, 6 on desktop (slice done in render via hidden class)
  const topItems = items.slice(0, 6);

  return (
    <div className="bg-bg-elev rounded-[var(--radius-xl)] p-4 md:p-6 shadow-[var(--shadow-default)] mb-4 md:mb-6">
      <h3 className="text-sm md:text-base font-semibold text-fg mb-4">
        카테고리 분포
      </h3>

      {isEmpty ? (
        <div className="text-center py-8">
          <div className="size-8 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-3">
            <span className="text-base" aria-hidden="true">📊</span>
          </div>
          <p className="text-sm font-semibold text-fg mb-1">이번 달 지출이 아직 없어요</p>
          <p className="text-xs text-fg-muted">지출을 추가하면 카테고리별로 분포가 표시돼요.</p>
        </div>
      ) : (
        <div className="flex gap-4 md:gap-6 items-start">
          {/* Donut */}
          <div className="relative shrink-0 w-[120px] h-[120px] md:w-[180px] md:h-[180px]">
            <CategoryDistributionChart breakdown={breakdown} />
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] md:text-[11px] text-fg-muted">총 지출</span>
              <span className="num text-[11px] md:text-sm font-bold text-fg leading-tight">
                {formatCurrency(totalExpense)}
              </span>
            </div>
          </div>

          {/* Top N list */}
          <div className="flex-1 min-w-0 space-y-2 md:space-y-2.5">
            {topItems.map((item, index) => {
              const tone = getCategoryTone(item.name);
              return (
                <div
                  key={item.categoryUuid}
                  className={`flex items-center gap-2 ${index >= 5 ? "hidden md:flex" : ""}`}
                >
                  <div
                    className="flex items-center justify-center size-7 rounded-lg text-sm shrink-0"
                    style={{ background: tone.bg, color: tone.fg }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-medium text-fg truncate">
                        {item.name}
                      </span>
                      <span className="num text-xs font-semibold text-fg shrink-0">
                        {item.percentage}%
                      </span>
                    </div>
                    <span className="num text-[11px] text-fg-muted">
                      {formatCurrency(item.totalAmount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
