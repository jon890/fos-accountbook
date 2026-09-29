"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getCategoryTone } from "@/lib/utils/category-tone";
import { formatCurrency } from "@/lib/utils/format";
import type { MonthlyCategoryBreakdown } from "@/types/dashboard";

interface CategoryDistributionProps {
  breakdown: MonthlyCategoryBreakdown;
}

const EMPTY_DONUT_FILL = "var(--color-neutral-200)";

interface EmptyEntry {
  value: number;
  fill: string;
}

interface DataEntry {
  categoryUuid: string;
  name: string;
  icon: string;
  color?: string;
  totalAmount: number;
  percentage: number;
  fill: string;
}

const EMPTY_DONUT: EmptyEntry[] = [{ value: 1, fill: EMPTY_DONUT_FILL }];

export function CategoryDistribution({ breakdown }: CategoryDistributionProps) {
  const { totalExpense, items } = breakdown;
  const isEmpty = items.length === 0;

  const chartData: EmptyEntry[] | DataEntry[] = isEmpty
    ? EMPTY_DONUT
    : items.map((item) => ({
        ...item,
        fill: getCategoryTone(item.name).fg,
      }));

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
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="80%"
                  dataKey={isEmpty ? "value" : "totalAmount"}
                  stroke="none"
                  paddingAngle={isEmpty ? 0 : 2}
                  minAngle={4}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={"fill" in entry ? entry.fill : EMPTY_DONUT_FILL}
                    />
                  ))}
                </Pie>
                {!isEmpty && (
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(typeof value === "number" ? value : 0),
                      "지출",
                    ]}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-elev)",
                      color: "var(--color-fg)",
                    }}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
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
