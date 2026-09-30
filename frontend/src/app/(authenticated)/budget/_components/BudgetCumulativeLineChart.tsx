"use client";

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
import { formatCurrency } from "@/lib/utils/format";

export interface ChartEntry {
  day: number;
  cumulative: number;
  dailyExpense: number;
  exceeded: boolean;
}

interface BudgetCumulativeLineChartProps {
  chartData: ChartEntry[];
  budget: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: ChartEntry }[];
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: ChartEntry;
  index?: number;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  const hasData = active && payload && payload.length > 0;
  if (!hasData) {
    return null;
  }

  const entry = payload[0].payload;

  return (
    <div className="bg-bg-elev border border-border shadow-md rounded-md p-2.5 text-xs text-fg">
      <p className="font-medium mb-1">{entry.day}일</p>
      <p>
        누적:{" "}
        <span className="num font-semibold">
          {formatCurrency(entry.cumulative)}
        </span>
      </p>
      <p className="text-fg-muted">
        일 지출: {formatCurrency(entry.dailyExpense)}
      </p>
    </div>
  );
}

function renderDot({ cx, cy, payload, index }: DotProps) {
  const hasCoordinates = cx != null && cy != null;
  if (!hasCoordinates || !payload?.exceeded) {
    return <g key={`dot-${index}`} />;
  }

  return (
    <circle
      key={`dot-exceeded-${index}`}
      cx={cx}
      cy={cy}
      r={4}
      fill="var(--color-expense)"
      stroke="var(--color-bg-elev)"
      strokeWidth={1.5}
    />
  );
}

export default function BudgetCumulativeLineChart({
  chartData,
  budget,
}: BudgetCumulativeLineChartProps) {
  return (
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
          tickFormatter={(value: number) => `${Math.round(value / 10000)}만`}
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
  );
}
