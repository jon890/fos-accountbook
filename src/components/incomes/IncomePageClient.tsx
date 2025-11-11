"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddIncomeDialog } from "./AddIncomeDialog";

interface IncomePageClientProps {
  familyUuid: string;
}

export function IncomePageClient({ familyUuid }: IncomePageClientProps) {
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

