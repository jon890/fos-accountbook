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
  selectedDate: string;
  expenseTotal: number;
  expenses: Expense[];
  incomes: Income[];
  colors: Map<string, MemberColor>;
  onAdd: () => void;
  onEdit: (transaction: CalendarTransaction) => void;
}

export function DayTransactionList({ selectedDate, expenseTotal, expenses, incomes, colors, onAdd, onEdit }: DayTransactionListProps) {
  const [year, month, day] = selectedDate.split("-").map(Number);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const dayExpenses = expenses.filter((transaction) => transaction.date.slice(0, 10) === selectedDate);
  const dayIncomes = incomes.filter((transaction) => transaction.date.slice(0, 10) === selectedDate);
  const transactions: CalendarTransaction[] = [
    ...dayExpenses.map((transaction): CalendarTransaction => ({ type: "expense", transaction })),
    ...dayIncomes.map((transaction): CalendarTransaction => ({ type: "income", transaction })),
  ];
  transactions.sort((left, right) => left.transaction.date.localeCompare(right.transaction.date));

  return (
    <section className="space-y-3 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-fg">{month}월 {day}일 ({weekday})</h2>
        <span className="text-xs text-fg-muted">지출 <span className="num font-semibold text-expense">{formatCurrency(expenseTotal)}</span></span>
      </div>
      {transactions.length === 0 ? (
        <EmptyState icon={CalendarDays} title="이 날 기록이 없어요" description="지출이나 수입을 기록해 보세요." />
      ) : (
        <ul className="divide-y divide-border">
          {transactions.map((item) => {
            const member = getMemberColor(colors, item.transaction.userUuid);
            return (
              <li key={`${item.type}-${item.transaction.uuid}`} className="flex items-center gap-2">
                <span className={`shrink-0 text-[11px] font-medium ${item.type === "expense" ? "text-expense" : "text-income"}`}>{item.type === "expense" ? "지출" : "수입"}</span>
                <div className="min-w-0 flex-1">
                  <TransactionRow
                    variant="compact"
                    tx={{
                      ...item.transaction,
                      createdBy: {
                        uuid: item.transaction.userUuid,
                        name: member.label,
                        colorClass: member.bgClass,
                      },
                    }}
                    onEdit={() => onEdit(item)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Button className="h-11 w-full" onClick={onAdd}><Plus className="size-4" />이 날짜에 추가</Button>
    </section>
  );
}
