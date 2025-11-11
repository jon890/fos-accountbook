"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AddExpenseForm } from "@/components/expenses/forms/AddExpenseForm";
import type { CategoryResponse } from "@/types/category";

interface ExpenseTabContentProps {
  categories: CategoryResponse[];
  familyUuid: string;
}

/**
 * Expense Tab Content Component
 * Transactions 페이지의 지출 탭 전용 컴포넌트
 */
export function ExpenseTabContent({
  categories,
  familyUuid,
}: ExpenseTabContentProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const router = useRouter();

  const handleExpenseAdded = () => {
    setIsAddDialogOpen(false);
    // 페이지 새로고침으로 서버 컴포넌트 리렌더링
    router.refresh();
  };

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">+ 지출 추가</Button>
      </DialogTrigger>
      <DialogContent className="p-0 border-0 bg-transparent">
        <AddExpenseForm
          categories={categories}
          familyUuid={familyUuid}
          onSuccess={handleExpenseAdded}
          onCancel={() => setIsAddDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
