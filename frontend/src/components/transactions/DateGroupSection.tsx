import { ReactNode } from "react";
import type { Expense } from "@/types/expense";
import type { Income } from "@/types/income";
import type { DateGroupWithTotal } from "@/types/transaction";
import { TransactionRow, type TxBase } from "./TransactionRow";
import { formatCurrency } from "@/lib/utils/format";

interface DateGroupSectionProps<T extends TxBase> {
  group: DateGroupWithTotal<T>;
  variant?: "compact" | "full";
  renderItem?: (item: T, index: number) => ReactNode;
}

export function DateGroupSection<T extends TxBase>({
  group,
  variant = "full",
  renderItem,
}: DateGroupSectionProps<T>) {
  return (
    <div>
      {/* 날짜 헤더 */}
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[12.5px] md:text-[13px] font-semibold md:font-bold text-fg-muted">
          {group.label}
        </span>
        <span className="text-[11.5px] md:text-xs font-semibold text-fg-subtle">
          합계 {formatCurrency(group.totalAmount)}
        </span>
      </div>

      {/* 카드 */}
      <div className="bg-bg-elev rounded-md border border-border divide-y divide-border">
        {group.items.map((item, i) =>
          renderItem ? (
            renderItem(item, i)
          ) : (
            <div key={item.uuid} className="px-3 md:px-4">
              <TransactionRow tx={item} variant={variant} />
            </div>
          )
        )}
      </div>
    </div>
  );
}

// 타입 별칭 — 지출/수입 혼합 그룹에 편의 사용
export type ExpenseDateGroup = DateGroupWithTotal<Expense>;
export type IncomeDateGroup = DateGroupWithTotal<Income>;
