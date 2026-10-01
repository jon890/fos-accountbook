import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Expense } from "@/types/expense";
import type { Income } from "@/types/income";
import type { DateGroupWithTotal, TransactionRowKind } from "@/types/transaction";
import { formatCurrency } from "@/lib/utils/format";
import { TransactionRow, type TxBase } from "./TransactionRow";

interface DateGroupSectionProps<T extends TxBase> {
  group: DateGroupWithTotal<T>;
  variant?: "compact" | "full";
  kind?: TransactionRowKind;
  incomeTotal?: number;
  renderItem?: (item: T, index: number) => ReactNode;
}

export function DateGroupSection<T extends TxBase>({
  group,
  variant = "full",
  kind = "expense",
  incomeTotal,
  renderItem,
}: DateGroupSectionProps<T>) {
  const month = group.dateKey.slice(0, 7);
  const href = `/calendar?month=${month}&date=${group.dateKey}`;
  const total = formatCurrency(group.totalAmount);
  const isIncomeGroup = kind === "income";

  return (
    <div>
      <Link
        href={href}
        className="mb-2 flex min-h-11 items-center justify-between gap-3 px-1 text-[13px] font-semibold text-fg"
      >
        <span>{group.label}</span>
        <span className="ml-auto flex items-center gap-2">
          <span className={`num ${isIncomeGroup ? "text-income" : "text-expense"}`}>
            {isIncomeGroup && "+"}{total}
          </span>
          {incomeTotal !== undefined && (
            <span className="num text-income">+{formatCurrency(incomeTotal)}</span>
          )}
          <ChevronRight aria-hidden="true" className="size-4 text-fg-muted" />
        </span>
      </Link>

      <div className="divide-y divide-border rounded-md border border-border bg-bg-elev">
        {group.items.map((item, index) =>
          renderItem ? (
            renderItem(item, index)
          ) : (
            <div key={item.uuid} className="px-3 md:px-4">
              <TransactionRow tx={item} variant={variant} kind={kind} />
            </div>
          )
        )}
      </div>
    </div>
  );
}

export type ExpenseDateGroup = DateGroupWithTotal<Expense>;
export type IncomeDateGroup = DateGroupWithTotal<Income>;
