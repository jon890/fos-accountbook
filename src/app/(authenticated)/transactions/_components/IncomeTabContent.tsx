"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddIncomeDialog } from "@/components/incomes/dialogs/AddIncomeDialog";

interface IncomeTabContentProps {
  familyUuid: string;
}

/**
 * Income Tab Content Component
 * Transactions 페이지의 수입 탭 전용 컴포넌트
 */
export function IncomeTabContent({ familyUuid }: IncomeTabContentProps) {
  const [addIncomeDialogOpen, setAddIncomeDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setAddIncomeDialogOpen(true)}
        className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        수입 추가
      </Button>

      <AddIncomeDialog
        open={addIncomeDialogOpen}
        onOpenChange={setAddIncomeDialogOpen}
      />
    </>
  );
}
