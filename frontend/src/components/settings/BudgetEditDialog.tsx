"use client";

import { updateFamilyAction } from "@/actions/family/update-family-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface BudgetEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyUuid: string;
  familyName: string;
  currentBudget: number;
}

const QUICK_AMOUNTS = [
  { label: "+10만", value: 100_000 },
  { label: "+50만", value: 500_000 },
  { label: "+100만", value: 1_000_000 },
];

export function BudgetEditDialog({
  open,
  onOpenChange,
  familyUuid,
  familyName,
  currentBudget,
}: BudgetEditDialogProps) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [value, setValue] = useState(currentBudget.toString());
  const [isSaving, setIsSaving] = useState(false);

  // open 될 때마다 currentBudget 으로 리셋
  useEffect(() => {
    if (open) {
      setValue(currentBudget.toString());
    }
  }, [open, currentBudget]);

  const handleQuickAdd = (delta: number) => {
    const cur = parseFloat(value) || 0;
    setValue(String(cur + delta));
  };

  const handleSave = async () => {
    const budget = parseFloat(value);
    if (isNaN(budget) || budget < 0) {
      toast.error("올바른 예산 금액을 입력해주세요");
      return;
    }
    try {
      setIsSaving(true);
      const result = await updateFamilyAction(familyUuid, {
        name: familyName,
        monthlyBudget: budget,
      });
      if (result.success) {
        toast.success("월 예산이 설정되었습니다");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("예산 설정에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const body = (
    <div className="space-y-4 pt-2">
      <div>
        <p className="text-sm text-fg-muted">가족</p>
        <p className="text-base font-semibold text-fg">{familyName}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-fg mb-2">
          월 예산 (원)
        </label>
        <Input
          type="number"
          min="0"
          step="10000"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="font-num tabular-nums text-lg"
          autoFocus
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q.value}
              type="button"
              onClick={() => handleQuickAdd(q.value)}
              className="px-3 py-1.5 rounded-full bg-bg-muted text-fg text-xs font-medium hover:bg-brand-50 hover:text-brand-700 transition-colors"
            >
              {q.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setValue("0")}
            className="px-3 py-1.5 rounded-full bg-bg-muted text-fg-muted text-xs font-medium hover:bg-bg-muted transition-colors"
          >
            초기화
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSaving}
        >
          취소
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-brand-500 hover:bg-brand-600 text-brand-fg"
        >
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>월 예산 수정</DialogTitle>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader>
          <SheetTitle>월 예산 수정</SheetTitle>
        </SheetHeader>
        {body}
      </SheetContent>
    </Sheet>
  );
}
