"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getCategoryTone } from "@/lib/utils/category-tone";
import { formatCurrency } from "@/lib/utils/format";
import type { CategoryBreakdownWithDelta } from "@/types/analytics";

interface AnalyticsCategoryDonutProps {
  breakdown: CategoryBreakdownWithDelta;
  topN?: number;
}

const EMPTY_DONUT_FILL = "var(--color-bg-muted)";
const EMPTY_DONUT = [{ value: 1, fill: EMPTY_DONUT_FILL }];

const MONTH_LABEL = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-[11px] text-fg-subtle">—</span>;
  const isUp = delta > 0;
  const isDown = delta < 0;
  const color = isUp ? "text-expense" : isDown ? "text-income" : "text-fg-muted";
  const arrow = isUp ? "↑" : isDown ? "↓" : "·";
  return (
    <span className={`text-[11px] font-semibold ${color}`}>
      {arrow} {Math.abs(delta)}%
    </span>
  );
}

export function AnalyticsCategoryDonut({ breakdown, topN = 6 }: AnalyticsCategoryDonutProps) {
  const { totalExpense, totalDelta, items, month } = breakdown;
  const isEmpty = items.length === 0;
  const topItems = items.slice(0, topN);

  const chartData = isEmpty
    ? EMPTY_DONUT
    : items.map((item) => ({
        ...item,
        fill: getCategoryTone(item.name).fg,
      }));

  return (
    <div className="bg-bg-elev rounded-[var(--radius-xl)] p-4 md:p-6 shadow-[var(--shadow-default)]">
      {isEmpty ? (
        <p className="text-sm text-fg-muted text-center py-8">이번 달 지출 없음</p>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start">
          <div className="relative shrink-0 w-[172px] h-[172px] md:w-[160px] md:h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="85%"
                  dataKey={isEmpty ? "value" : "totalAmount"}
                  stroke="none"
                  paddingAngle={isEmpty ? 0 : 2}
                  minAngle={4}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={"fill" in entry ? entry.fill : EMPTY_DONUT_FILL} />
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
