import { CalendarDays, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty/EmptyState";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";
import { getMemberColor, type MemberColor } from "@/lib/utils/member-color";
import type { Expense } from "@/types/expense";
import type { Income } from "@/types/income";

export type CalendarTransaction = { type: "expense"; transaction: Expense } | { type: "income"; transaction: Income };

interface DayTransactionListProps {
  headingRef?: React.Ref<HTMLHeadingElement>;
  selectedDate: string;
  expenseTotal: number;
  expenses: Expense[];
  incomes: Income[];
  colors: Map<string, MemberColor>;
  onAdd: () => void;
  onEdit: (transaction: CalendarTransaction) => void;
}

export function DayTransactionList({ headingRef, selectedDate, expenseTotal, expenses, incomes, colors, onAdd, onEdit }: DayTransactionListProps) {
  const [year, month, day] = selectedDate.split("-").map(Number);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const dayExpenses = expenses.filter((transaction) => transaction.date.slice(0, 10) === selectedDate);
  const dayIncomes = incomes.filter((transaction) => transaction.date.slice(0, 10) === selectedDate);
  const incomeTotal = dayIncomes.reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
  const transactions: CalendarTransaction[] = [
    ...dayExpenses.map((transaction): CalendarTransaction => ({ type: "expense", transaction })),
    ...dayIncomes.map((transaction): CalendarTransaction => ({ type: "income", transaction })),
  ];
  transactions.sort((left, right) => left.transaction.date.localeCompare(right.transaction.date));

  return (
    <section className="space-y-3 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-3">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="scroll-mt-[4.5rem] scroll-mb-[7rem] text-base font-bold text-fg focus:outline-none md:scroll-mt-[5rem]"
        >
          {month}월 {day}일 ({weekday})
        </h2>
        <span className="flex items-center gap-2 text-xs text-fg-muted">
          <span>지출 <span className="num font-semibold text-expense">{formatCurrency(expenseTotal)}</span></span>
          {incomeTotal > 0 && <span>수입 <span className="num font-semibold text-income">+{formatCurrency(incomeTotal)}</span></span>}
        </span>
      </div>
      {transactions.length === 0 ? (
        <EmptyState icon={CalendarDays} title="이 날 기록이 없어요" description="지출이나 수입을 기록해 보세요." />
      ) : (
        <ul className="divide-y divide-border">
          {transactions.map((item) => {
            const member = getMemberColor(colors, item.transaction.userUuid);
            const excludeFromBudget =
              item.type === "expense" &&
              (item.transaction.excludeFromBudget ||
                item.transaction.category?.excludeFromBudget === true);
            return (
              <li key={`${item.type}-${item.transaction.uuid}`}>
                <TransactionRow
                  variant="compact"
                  kind={item.type}
                  tx={{
                    ...item.transaction,
                    excludeFromBudget,
                    createdBy: {
                      uuid: item.transaction.userUuid,
                      name: member.label,
                      colorClass: member.bgClass,
                    },
                  }}
                  onEdit={() => onEdit(item)}
                />
              </li>
            );
          })}
        </ul>
      )}
      <Button className="h-11 w-full" onClick={onAdd}><Plus className="size-4" />이 날짜에 추가</Button>
    </section>
  );
}
