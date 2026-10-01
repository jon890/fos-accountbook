"use client";

import { DateGroupSection } from "@/components/transactions/DateGroupSection";
import { EditTransactionDialog } from "@/components/transactions/dialogs/EditTransactionDialog";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { buildMemberColorMap, getMemberColor } from "@/lib/utils/member-color";
import { groupTransactionsWithTotal } from "@/services/transaction/transaction-service";
import type { Expense } from "@/types/expense";
import type { FamilyMemberSummary } from "@/types/family";
import { useState } from "react";

interface ExpenseListClientProps {
  expenses: Expense[];
  familyUuid: string;
  members: FamilyMemberSummary[];
}

export function ExpenseListClient({
  expenses,
  familyUuid,
  members,
}: ExpenseListClientProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const memberColors = buildMemberColorMap(members);
  const groups = groupTransactionsWithTotal(expenses);

  return (
    <>
      <div className="space-y-5">
        {groups.map((group) => (
          <DateGroupSection
            key={group.dateKey}
            group={group}
            renderItem={(expense) => {
              const member = getMemberColor(memberColors, expense.userUuid);
              return (
                <div key={expense.uuid} className="px-3 md:px-4">
                  <TransactionRow
                    tx={{
                      ...expense,
                      createdBy: { name: member.label, colorClass: member.bgClass },
                    }}
                    variant="full"
                    onEdit={() => setEditingExpense(expense)}
                  />
                </div>
              );
            }}
          />
        ))}
      </div>

      {editingExpense && (
        <EditTransactionDialog
          key={editingExpense.uuid}
          open={!!editingExpense}
          onOpenChange={(open) => {
            if (!open) setEditingExpense(null);
          }}
          type="expense"
          transaction={editingExpense}
          familyUuid={familyUuid}
        />
      )}
    </>
  );
}
