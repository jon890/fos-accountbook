"use client";

import { EditTransactionDialog } from "@/components/transactions/dialogs/EditTransactionDialog";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import type { RecurringExpense } from "@/types/recurring-expense";
import { useState } from "react";

interface RecurringExpenseItemProps {
  recurringExpense: RecurringExpense;
}

export function RecurringExpenseItem({
  recurringExpense,
}: RecurringExpenseItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const category = {
    uuid: recurringExpense.category?.uuid ?? "",
    name: recurringExpense.category?.name ?? "미분류",
    icon: recurringExpense.category?.icon ?? "📁",
    color: recurringExpense.category?.color,
  };

  return (
    <>
      <TransactionRow
        tx={{
          uuid: recurringExpense.uuid,
          amount: recurringExpense.amount,
          description: recurringExpense.name,
          category,
        }}
        variant="compact"
        metadata={`매월 ${recurringExpense.dayOfMonth}일`}
        trailing={
          recurringExpense.generatedThisMonth ? (
            <span className="mt-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
              이번 달 반영됨
            </span>
          ) : undefined
        }
        onEdit={() => setIsEditOpen(true)}
      />

      <EditTransactionDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        type="recurring"
        transaction={recurringExpense}
      />
    </>
  );
}
