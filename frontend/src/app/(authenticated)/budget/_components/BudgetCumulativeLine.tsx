"use client";

import { formatCurrency } from "@/lib/utils/format";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BudgetCumulativeLineProps {
  dailyExpenses: { date: string; income: number; expense: number }[];
  budget: number;
  daysInMonth: number;
}

interface ChartEntry {
  day: number;
  cumulative: number;
  dailyExpense: number;
  exceeded: boolean;
}

interface TooltipPayloadItem {
  payload: ChartEntry;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-bg-elev border border-border shadow-md rounded-md p-2.5 text-xs text-fg">
      <p className="font-medium mb-1">{d.day}일</p>
      <p>
        누적:{" "}
        <span className="num font-semibold">{formatCurrency(d.cumulative)}</span>
      </p>
      <p className="text-fg-muted">
        일 지출: {formatCurrency(d.dailyExpense)}
      </p>
    </div>
  );
}

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
  const pct = budget > 0 ? Math.min(Math.round((totalCumulative / budget) * 100), 100) : 0;

  const renderDot = (props: { cx?: number; cy?: number; payload?: ChartEntry; index?: number }) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null || !payload?.exceeded) return <g key={`dot-${props.index}`} />;
    return (
      <circle
        key={`dot-exceeded-${props.index}`}
        cx={cx}
        cy={cy}
        r={4}
        fill="var(--color-expense)"
        stroke="var(--color-bg-elev)"
        strokeWidth={1.5}
      />
    );
  };

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
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="day"
              interval="preserveStartEnd"
              tick={{ fill: "var(--color-fg-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => `${Math.round(v / 10000)}만`}
              tick={{ fill: "var(--color-fg-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={budget}
              stroke="var(--color-brand-700)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="var(--color-brand-500)"
              strokeWidth={2.5}
              dot={renderDot}
              activeDot={{ r: 5, fill: "var(--color-brand-500)" }}
            />
          </LineChart>
        </ResponsiveContainer>
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
