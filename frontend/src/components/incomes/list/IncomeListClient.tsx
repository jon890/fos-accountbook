"use client";

import { DateGroupSection } from "@/components/transactions/DateGroupSection";
import { groupTransactionsWithTotal } from "@/services/transaction/transaction-service";
import type { Income } from "@/types/income";
import { useRouter, useSearchParams } from "next/navigation";
import { IncomeItem } from "./IncomeItem";

interface IncomeListClientProps {
  incomes: Income[];
  familyUuid: string;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export function IncomeListClient({
  incomes,
  familyUuid,
  totalPages,
  currentPage,
}: IncomeListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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
            renderItem={(income) => (
              <IncomeItem
                key={income.uuid}
                income={income}
                familyUuid={familyUuid}
              />
            )}
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
    </div>
  );
}
