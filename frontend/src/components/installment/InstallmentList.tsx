"use client";

import { EmptyState } from "@/components/empty/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";
import type { Installment } from "@/types/installment";
import { CreditCard, Plus } from "lucide-react";
import { useState } from "react";
import { InstallmentDialog } from "./InstallmentDialog";
import { InstallmentItem } from "./InstallmentItem";

interface InstallmentListProps {
  items: Installment[];
  /** 등록 창의 기본 첫 결제 월 (YYYY-MM) */
  defaultStartMonth: string;
}

interface DialogState {
  open: boolean;
  installment?: Installment;
}

export function InstallmentList({
  items,
  defaultStartMonth,
}: InstallmentListProps) {
  const [dialog, setDialog] = useState<DialogState>({ open: false });

  const thisMonthTotal = items.reduce((sum, i) => sum + i.thisMonthAmount, 0);
  const remainingTotal = items.reduce((sum, i) => sum + i.remainingAmount, 0);
  const active = items.filter((i) => i.progress !== "COMPLETED");
  const completed = items.filter((i) => i.progress === "COMPLETED");

  const select = (installment: Installment) =>
    setDialog({ open: true, installment });

  return (
    <div className="space-y-3 md:space-y-4">
      <Card className="border-0 gradient-expense text-expense-fg shadow-xl">
        <CardContent className="flex items-start justify-between gap-3 p-4 md:p-6">
          <div>
            <p className="text-sm opacity-90">이번 달 할부</p>
            <p className="mt-1 text-2xl font-bold md:text-3xl">
              {formatCurrency(thisMonthTotal)}
            </p>
            <p className="mt-2 text-sm opacity-90">
              남은 할부 {formatCurrency(remainingTotal)}
            </p>
            <p className="mt-1 text-xs opacity-80">
              예산과 합계에는 포함되지 않아요
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDialog({ open: true })}
          >
            <Plus className="size-4" />
            할부 추가
          </Button>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="등록된 할부가 없습니다"
          description="「할부 추가」 버튼으로 진행 중인 할부를 기록해 보세요."
        />
      ) : (
        <>
          {active.length > 0 && (
            <Card className="border border-border bg-bg-elev shadow-xl">
              <CardContent className="p-3 md:p-6">
                <h3 className="mb-1 text-sm font-semibold text-fg">진행 중</h3>
                <div className="divide-y divide-border">
                  {active.map((installment) => (
                    <InstallmentItem
                      key={installment.uuid}
                      installment={installment}
                      onSelect={select}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {completed.length > 0 && (
            <Card className="border border-border bg-bg-elev shadow-xl">
              <CardContent className="p-3 md:p-6">
                <h3 className="mb-1 text-sm font-semibold text-fg">완료</h3>
                <div className="divide-y divide-border">
                  {completed.map((installment) => (
                    <InstallmentItem
                      key={installment.uuid}
                      installment={installment}
                      onSelect={select}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <InstallmentDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        installment={dialog.installment}
        defaultStartMonth={defaultStartMonth}
      />
    </div>
  );
}
