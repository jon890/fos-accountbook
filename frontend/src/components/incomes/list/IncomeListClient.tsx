"use client";

import { DateGroupSection } from "@/components/transactions/DateGroupSection";
import { EditTransactionDialog } from "@/components/transactions/dialogs/EditTransactionDialog";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { buildMemberColorMap, getMemberColor } from "@/lib/utils/member-color";
import { groupTransactionsWithTotal } from "@/services/transaction/transaction-service";
import type { Income } from "@/types/income";
import type { FamilyMemberSummary } from "@/types/family";
import { useSearchParams } from "next/navigation";
import { useAppRouter } from "@/lib/client/navigation";
import { useState } from "react";

interface IncomeListClientProps {
  incomes: Income[];
  familyUuid: string;
  totalPages: number;
  currentPage: number;
  members: FamilyMemberSummary[];
}

export function IncomeListClient({
  incomes,
  familyUuid,
  totalPages,
  currentPage,
  members,
}: IncomeListClientProps) {
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const memberColors = buildMemberColorMap(members);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/transactions?${params.toString()}`);
  };

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

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-bg-elev border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-muted"
          >
            이전
          </button>
          <span className="px-4 py-2 text-sm text-fg-muted">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-bg-elev border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-muted"
          >
            다음
          </button>
        </div>
      )}

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
