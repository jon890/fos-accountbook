"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/client/utils";
import { formatCurrency } from "@/lib/utils/format";
import type { Installment } from "@/types/installment";

interface InstallmentItemProps {
  installment: Installment;
  onSelect: (installment: Installment) => void;
}

function subtitle(installment: Installment): string {
  const { progress, installmentMonths } = installment;
  if (progress === "COMPLETED") {
    return `완납 · ${installmentMonths}개월`;
  }
  if (progress === "UPCOMING") {
    const year = Number(installment.startMonth.slice(0, 4));
    const month = Number(installment.startMonth.slice(5, 7));
    return `${year}년 ${month}월 시작 · ${installmentMonths}개월`;
  }
  return `${installment.currentRound}/${installmentMonths}회 · 월 ${formatCurrency(installment.monthlyAmount)}`;
}

export function InstallmentItem({
  installment,
  onSelect,
}: InstallmentItemProps) {
  const isCompleted = installment.progress === "COMPLETED";
  const percent = Math.round(
    (installment.currentRound / installment.installmentMonths) * 100,
  );

  return (
    <button
      type="button"
      aria-label={`${installment.name} 할부 수정`}
      onClick={() => onSelect(installment)}
      className={cn(
        "block w-full space-y-2 py-3 text-left transition-colors hover:bg-bg-muted",
        isCompleted && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">
            {installment.name}
          </p>
          <p className="mt-0.5 text-xs text-fg-muted">{subtitle(installment)}</p>
        </div>
        <div className="shrink-0 text-right">
          {!isCompleted && (
            <p className="text-xs text-fg-muted">남은 금액</p>
          )}
          <p className="font-num tabular-nums text-sm font-semibold text-expense">
            {formatCurrency(
              isCompleted ? installment.totalAmount : installment.remainingAmount,
            )}
          </p>
        </div>
      </div>
      <Progress value={percent} />
    </button>
  );
}
