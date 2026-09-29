"use client";

import { Button } from "@/components/ui/button";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import type { RecentExpense } from "@/types/dashboard";
import { Inbox } from "lucide-react";
import Link from "next/link";

interface RecentActivityProps {
  expenses: RecentExpense[];
}

export function RecentActivity({ expenses }: RecentActivityProps) {
  const hasExpenses = expenses.length > 0;

  return (
    <div className="bg-bg-elev rounded-[var(--radius-xl)] shadow-[var(--shadow-default)] mb-4 md:mb-6">
      <div className="flex items-center justify-between px-4 md:px-6 pt-4 md:pt-5 pb-3">
        <h3 className="text-sm md:text-base font-semibold text-fg">최근 활동</h3>
        <span className="text-xs text-fg-muted">{expenses.length}건</span>
      </div>

      <div className="px-4 md:px-6 pb-4 md:pb-5">
        {!hasExpenses ? (
          <div className="text-center py-8">
            <div className="size-8 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-3">
              <Inbox className="size-4 text-brand-500" />
            </div>
            <p className="text-sm font-semibold text-fg mb-1">아직 거래가 없어요</p>
            <p className="text-xs text-fg-muted">지출이나 수입을 추가하면 여기에 표시돼요.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[var(--color-border)]">
              {expenses.map((expense) => (
                <TransactionRow
                  key={expense.uuid}
                  variant="compact"
                  tx={{
                    uuid: expense.uuid,
                    amount: Number(expense.amount),
                    description: expense.description,
                    date: expense.date,
                    category: expense.category,
                    createdBy: expense.createdBy ?? null,
                  }}
                />
              ))}
            </div>
            {expenses.length >= 10 && (
              <div className="pt-3">
                <Link href="/expenses">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl text-sm border-[var(--color-border)]"
                  >
                    모든 지출 내역 보기
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
