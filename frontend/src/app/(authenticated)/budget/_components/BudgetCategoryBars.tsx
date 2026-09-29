import { getCategoryTone } from "@/lib/utils/category-tone";
import type { CategoryBreakdownItem } from "@/types/dashboard";
import { formatCurrency } from "@/lib/utils/format";

const WARNING_BUDGET_PCT = 30;
const BAR_SCALE_FLOOR_RATIO = 0.5;

interface BudgetCategoryBarsProps {
  items: CategoryBreakdownItem[];
  budget: number;
}

export function BudgetCategoryBars({
  items,
  budget,
}: BudgetCategoryBarsProps) {
  const top5 = [...items]
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  const maxAmount = top5[0]?.totalAmount ?? 0;
  const barBase = Math.max(maxAmount, budget * BAR_SCALE_FLOOR_RATIO);

  if (top5.length === 0) {
    return (
      <div className="bg-bg-elev border border-border rounded-2xl p-5 md:p-6">
        <p className="text-sm font-semibold text-fg mb-1">카테고리 top 5</p>
        <p className="text-xs text-fg-muted mb-4">이번 달 지출이 큰 순</p>
        <p className="text-sm text-fg-muted text-center py-6">
          이번 달 지출이 아직 없어요
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg-elev border border-border rounded-2xl p-5 md:p-6">
      <p className="text-sm font-semibold text-fg mb-0.5">카테고리 top 5</p>
      <p className="text-xs text-fg-muted mb-4">이번 달 지출이 큰 순</p>

      <div className="space-y-4">
        {top5.map((item) => {
          const tone = getCategoryTone(item.name);
          const budgetPct =
            budget > 0 ? Math.round((item.totalAmount / budget) * 100) : 0;
          const barWidthPct =
            barBase > 0
              ? Math.min(Math.round((item.totalAmount / barBase) * 100), 100)
              : 0;

          return (
            <div key={item.categoryUuid} className="flex items-center gap-3">
              <div
                className="h-9 w-9 flex-shrink-0 rounded-xl flex items-center justify-center"
                style={{ background: tone.bg }}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: tone.fg }}
                >
                  {item.icon || item.name[0] || "?"}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-fg text-sm font-medium truncate">
                    {item.name}
                  </span>
                  <span className="num text-fg text-sm font-bold flex-shrink-0">
                    {formatCurrency(item.totalAmount)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${barWidthPct}%`, background: tone.fg }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-fg-muted">
                  <span>예산의 {budgetPct}%</span>
                  {budgetPct >= WARNING_BUDGET_PCT && (
                    <span className="text-expense font-semibold">↑ 많음</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
