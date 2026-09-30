"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
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

  const handleExpenseAdded = () => {
    setIsAddDialogOpen(false);
  };

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-expense hover:opacity-90 text-expense-fg">+ 지출 추가</Button>
      </DialogTrigger>
      <DialogContent className="bg-bg-elev">
        <DialogTitle className="sr-only">지출 추가</DialogTitle>
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
