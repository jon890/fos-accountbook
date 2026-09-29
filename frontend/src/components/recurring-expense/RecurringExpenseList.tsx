"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { GetRecurringExpensesResponse } from "@/types/recurring-expense";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddTransactionDialog } from "@/components/transactions/dialogs/AddTransactionDialog";
import { RecurringExpenseItem } from "./RecurringExpenseItem";

interface RecurringExpenseListProps {
  data: GetRecurringExpensesResponse;
}

export function RecurringExpenseList({ data }: RecurringExpenseListProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);

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
            <div className="py-10 md:py-16">
              <p className="text-center text-gray-500 text-sm md:text-base">
                등록된 고정지출이 없습니다
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
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

      {/* 추가 버튼 */}
      <Button
        onClick={() => setIsAddOpen(true)}
        className="w-full gradient-expense text-expense-fg hover:opacity-90 shadow-lg"
      >
        <Plus className="w-4 h-4 mr-2" />
        고정지출 추가
      </Button>

      {/* 거래 추가 다이얼로그 */}
      <AddTransactionDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        defaultType="recurring"
      />
    </div>
  );
}
