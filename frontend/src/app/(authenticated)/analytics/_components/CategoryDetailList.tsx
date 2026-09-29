"use client";

import { cn } from "@/lib/client/utils";
import { getCategoryTone } from "@/lib/utils/category-tone";
import { formatCurrency } from "@/lib/utils/format";
import type { CategoryWithDelta } from "@/types/analytics";

interface CategoryDetailListProps {
  items: CategoryWithDelta[];
  totalExpense: number;
  topN?: number;
}

function DeltaCell({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-[11px] text-fg-subtle">—</span>;
  if (delta === 0) return <span className="text-[11px] text-fg-muted">·</span>;
  const isUp = delta > 0;
  return (
    <span className={cn("text-[11px] font-semibold whitespace-nowrap", isUp ? "text-expense" : "text-income")}>
      {isUp ? "+" : "−"}
      {Math.abs(delta)}%
    </span>
  );
}

export function CategoryDetailList({ items, totalExpense, topN = 6 }: CategoryDetailListProps) {
  const visible = items.slice(0, topN);

  if (visible.length === 0) {
    return (
      <div className="bg-bg-elev rounded-[var(--radius-xl)] p-4 md:p-6 shadow-[var(--shadow-default)]">
        <div className="h-24 flex items-center justify-center text-fg-subtle text-sm">
          지출 내역이 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-elev rounded-[var(--radius-xl)] p-4 md:p-6 shadow-[var(--shadow-default)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-fg">
          <span className="md:hidden">카테고리별</span>
          <span className="hidden md:inline">카테고리별 상세</span>
        </h2>
        <span className="text-[11px] text-fg-muted">전월 대비 증감 포함</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-x-6 md:gap-y-3">
        {visible.map((item) => {
          const tone = getCategoryTone(item.name);
          const widthPct = totalExpense > 0 ? Math.min(100, (item.totalAmount / totalExpense) * 100) : 0;
          return (
            <div
              key={item.categoryUuid}
              className="md:grid md:grid-cols-[34px_1fr_90px_56px] md:items-center md:gap-2 flex items-center gap-3"
            >
              <div
                className="size-9 md:size-[34px] shrink-0 rounded-xl flex items-center justify-center text-base"
                style={{ background: tone.bg, color: tone.fg }}
                aria-hidden="true"
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-fg truncate">{item.name}</p>
                <div className="mt-1 h-1.5 bg-bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${widthPct}%`, background: tone.fg }}
                  />
                </div>
              </div>
              <span className="num text-xs font-bold text-fg shrink-0 text-right">
                {formatCurrency(item.totalAmount)}
              </span>
              <span className="shrink-0 text-right">
                <DeltaCell delta={item.deltaPercent} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
