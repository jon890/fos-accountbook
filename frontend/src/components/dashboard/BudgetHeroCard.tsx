import { formatCurrency } from "@/lib/utils/format";

interface BudgetHeroCardProps {
  remainingBudget: number;
  monthlyExpense: number;
  budget: number;
  daysRemaining: number;
}

export function BudgetHeroCard({
  remainingBudget,
  monthlyExpense,
  budget,
  daysRemaining,
}: BudgetHeroCardProps) {
  const hasBudget = budget > 0;
  const pct = hasBudget
    ? Math.min(100, Math.round((monthlyExpense / budget) * 100))
    : 0;
  const isExceeded = remainingBudget < 0;

  return (
    <div className="gradient-primary rounded-[var(--radius-xl)] p-5 md:p-6 text-brand-fg mb-4 overflow-hidden">
      <p className="text-xs md:text-sm font-medium opacity-85">
        이번 달 남은 예산
      </p>

      <p className="num text-[38px] md:text-[44px] font-bold leading-none mt-1 tracking-tight">
        {isExceeded ? `-${formatCurrency(Math.abs(remainingBudget))}` : formatCurrency(Math.abs(remainingBudget))}
      </p>

      {hasBudget ? (
        <>
          <div className="mt-3 mb-2 h-1.5 rounded-full bg-[var(--color-hero-track)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-hero-fill)] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs opacity-85">
            <span>
              <span className="num">{formatCurrency(monthlyExpense)}</span>
              <span className="opacity-70"> / {formatCurrency(budget)} 사용</span>
            </span>
            <span className="bg-[var(--color-hero-track)] rounded-full px-2.5 py-0.5 text-[11px] font-medium">
              {daysRemaining}일 남음
            </span>
          </div>
        </>
      ) : (
        <p className="mt-2 text-xs opacity-75">예산 미설정</p>
      )}
    </div>
  );
}
