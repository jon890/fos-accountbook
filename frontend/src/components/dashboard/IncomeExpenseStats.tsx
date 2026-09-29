import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

interface IncomeExpenseStatsProps {
  monthlyIncome: number;
  monthlyExpense: number;
}

export function IncomeExpenseStats({
  monthlyIncome,
  monthlyExpense,
}: IncomeExpenseStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
      <div className="bg-bg-elev rounded-[var(--radius-lg)] p-4 md:px-6 md:py-5 shadow-[var(--shadow-default)]">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingUp className="size-3.5 text-income opacity-80" />
          <p className="text-xs md:text-sm font-medium text-fg-muted">
            이번 달 수입
          </p>
        </div>
        <p className="num text-lg md:text-2xl font-bold text-income">
          {formatCurrency(monthlyIncome)}
        </p>
      </div>

      <div className="bg-bg-elev rounded-[var(--radius-lg)] p-4 md:px-6 md:py-5 shadow-[var(--shadow-default)]">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingDown className="size-3.5 text-expense opacity-80" />
          <p className="text-xs md:text-sm font-medium text-fg-muted">
            이번 달 지출
          </p>
        </div>
        <p className="num text-lg md:text-2xl font-bold text-expense">
          {formatCurrency(monthlyExpense)}
        </p>
      </div>
    </div>
  );
}
