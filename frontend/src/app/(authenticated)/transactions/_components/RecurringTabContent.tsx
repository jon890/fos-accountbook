"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddTransactionDialog } from "@/components/transactions/dialogs/AddTransactionDialog";

export function RecurringTabContent() {
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsAddOpen(true)}
        className="gradient-budget hover:opacity-90 text-brand-fg"
      >
        <Plus className="w-4 h-4 mr-2" />
        고정지출 추가
      </Button>

      <AddTransactionDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        defaultType="recurring"
      />
    </>
  );
}
