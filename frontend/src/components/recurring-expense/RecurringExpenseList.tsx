"use client";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty/EmptyState";
import type { GetRecurringExpensesResponse } from "@/types/recurring-expense";
import { Inbox } from "lucide-react";
import { RecurringExpenseItem } from "./RecurringExpenseItem";

interface RecurringExpenseListProps {
  data: GetRecurringExpensesResponse;
}

export function RecurringExpenseList({ data }: RecurringExpenseListProps) {
  return (
    <div className="space-y-3 md:space-y-4">
      {/* 이달 합계 카드 */}
      <Card className="border-0 gradient-expense text-expense-fg shadow-xl">
        <CardContent className="p-4 md:p-6">
          <p className="text-sm opacity-90">이번달 고정비</p>
          <p className="text-2xl md:text-3xl font-bold mt-1">
            ₩{data.totalMonthlyAmount.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* 목록 */}
      <Card className="border-0 glass shadow-xl">
        <CardContent className="p-3 md:p-6">
          {data.items.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="등록된 고정지출이 없습니다"
              description="화면 아래 가운데 + 버튼으로 고정지출을 추가할 수 있어요."
            />
          ) : (
            <div className="divide-y divide-border">
              {data.items.map((item) => (
                <RecurringExpenseItem
                  key={item.uuid}
                  recurringExpense={item}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
