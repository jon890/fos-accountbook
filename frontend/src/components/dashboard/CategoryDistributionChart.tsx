"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getCategoryTone } from "@/lib/utils/category-tone";
import { formatCurrency } from "@/lib/utils/format";
import type { MonthlyCategoryBreakdown } from "@/types/dashboard";

interface CategoryDistributionChartProps {
  breakdown: MonthlyCategoryBreakdown;
}

export default function CategoryDistributionChart({
  breakdown,
}: CategoryDistributionChartProps) {
  const chartData = breakdown.items.map((item) => ({
    ...item,
    fill: getCategoryTone(item.name).fg,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="80%"
          dataKey="totalAmount"
          stroke="none"
          paddingAngle={2}
          minAngle={4}
        >
          {chartData.map((entry) => (
            <Cell key={entry.categoryUuid} fill={entry.fill} />
          ))}
        </Pie>
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
      </PieChart>
    </ResponsiveContainer>
  );
}
