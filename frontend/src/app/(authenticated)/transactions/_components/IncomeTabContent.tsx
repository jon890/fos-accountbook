"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddTransactionDialog } from "@/components/transactions/dialogs/AddTransactionDialog";

/**
 * Income Tab Content Component
 * Transactions 페이지의 수입 탭 전용 컴포넌트
 * 카테고리는 AddTransactionDialog가 내부에서 직접 fetch
 */
export function IncomeTabContent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gradient-income hover:opacity-90 text-income-fg"
      >
        <Plus className="w-4 h-4 mr-2" />
        수입 추가
      </Button>

      <AddTransactionDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        defaultType="income"
      />
    </>
  );
}
