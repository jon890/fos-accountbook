import Link from "next/link";
import { Fragment } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/client/utils";
import { formatCurrency } from "@/lib/utils/format";
import type { BudgetSummary } from "@/types/budget-item";

interface BudgetSummaryCardProps {
  summary: BudgetSummary;
}

interface BudgetLine {
  key: string;
  name: string;
  spent: number;
  limit: number;
}

export function BudgetSummaryCard({ summary }: BudgetSummaryCardProps) {
  const isEmpty = summary.total.limit === 0 && summary.items.length === 0;
  const lines: BudgetLine[] = [
    { key: "total", name: "예산", ...summary.total },
    { key: "living", name: "생활비", ...summary.living },
    ...summary.items.map((item) => ({
      key: item.budgetItemUuid,
      name: item.name,
      spent: item.spent,
      limit: item.limit,
    })),
  ];

  return (
    <Link
      href="/budget"
      aria-label="예산 요약, 예산 화면으로 이동"
      className="block"
    >
      <Card>
        <CardContent className="space-y-3">
          {isEmpty ? (
            <p className="text-sm text-fg-muted">예산 항목을 만들면 여기서 볼 수 있어요</p>
          ) : (
            lines.map((line) => (
              <Fragment key={line.key}>
                <BudgetSummaryLine line={line} />
                {line.key === "living" && summary.allocationExceeded && (
                  <p className="text-xs text-expense">항목 한도가 예산을 넘었어요</p>
                )}
              </Fragment>
            ))
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function BudgetSummaryLine({ line }: { line: BudgetLine }) {
  const hasLimit = line.limit > 0;
  // spent / limit * 100 은 부동소수점 오차로 102.5 가 102 로 내림될 수 있어 곱셈을 먼저 한다
  const percent = hasLimit ? Math.round((line.spent * 100) / line.limit) : 0;
  const isOver = hasLimit && line.spent > line.limit;
  const amountClass = cn("num font-semibold", isOver ? "text-expense" : "text-fg");

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-fg-muted">{line.name}</span>
        <span className="num text-fg-muted">
          <span className={amountClass}>{formatCurrency(line.spent)}</span>
          {hasLimit && ` / ${formatCurrency(line.limit)}`}
        </span>
      </div>
      {hasLimit && (
        <div className="flex items-center gap-3">
          <Progress
            value={Math.min(percent, 100)}
            aria-label={`${line.name} 사용률`}
            className={cn(isOver && "[&>[data-slot=progress-indicator]]:bg-expense")}
          />
          <span className={cn("num w-10 shrink-0 text-right text-xs", isOver && "text-expense")}>
            {percent}%
          </span>
        </div>
      )}
    </div>
  );
}
