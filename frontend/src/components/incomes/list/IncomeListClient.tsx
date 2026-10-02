"use client";

import { DateGroupSection } from "@/components/transactions/DateGroupSection";
import { EditTransactionDialog } from "@/components/transactions/dialogs/EditTransactionDialog";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { buildMemberColorMap, getMemberColor } from "@/lib/utils/member-color";
import { groupTransactionsWithTotal } from "@/services/transaction/transaction-service";
import type { Income } from "@/types/income";
import type { FamilyMemberSummary } from "@/types/family";
import { useState } from "react";

interface IncomeListClientProps {
  incomes: Income[];
  familyUuid: string;
  members: FamilyMemberSummary[];
}

export function IncomeListClient({
  incomes,
  familyUuid,
  members,
}: IncomeListClientProps) {
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const memberColors = buildMemberColorMap(members);

  const groups = groupTransactionsWithTotal(incomes);

  return (
    <div className="space-y-4">
      <div className="space-y-5">
        {groups.map((group) => (
          <DateGroupSection
            key={group.dateKey}
            group={group}
            kind="income"
            renderItem={(income) => {
              const member = getMemberColor(memberColors, income.userUuid);
              return (
                <div key={income.uuid} className="px-3 md:px-4">
                  <TransactionRow
                    tx={{
                      ...income,
                      createdBy: { name: member.label, colorClass: member.bgClass },
                    }}
                    variant="full"
                    kind="income"
                    onEdit={() => setEditingIncome(income)}
                  />
                </div>
              );
            }}
          />
        ))}
      </div>

      {editingIncome && (
        <EditTransactionDialog
          key={editingIncome.uuid}
          open={Boolean(editingIncome)}
          onOpenChange={(open) => {
            if (!open) setEditingIncome(null);
          }}
          type="income"
          transaction={editingIncome}
          familyUuid={familyUuid}
        />
      )}
    </div>
  );
}
