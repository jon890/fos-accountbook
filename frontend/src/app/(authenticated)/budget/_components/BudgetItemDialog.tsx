"use client";

import { createBudgetItemAction } from "@/actions/budget-item/create-budget-item-action";
import { updateBudgetItemAction } from "@/actions/budget-item/update-budget-item-action";
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
import { cn } from "@/lib/client/utils";
import type { BudgetItem } from "@/types/budget-item";
import type { CategoryResponse } from "@/types/category";
import { useState } from "react";
import { toast } from "sonner";

const NAME_MAX_LENGTH = 30;

interface BudgetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 있으면 수정, 없으면 생성 */
  item?: BudgetItem;
  expenseCategories: CategoryResponse[];
  /** 다른 항목이 이미 쓰는 카테고리. 수정 중인 항목 자신의 카테고리는 넣지 않는다 */
  takenCategoryUuids: Set<string>;
}

export function BudgetItemDialog({
  open,
  onOpenChange,
  item,
  expenseCategories,
  takenCategoryUuids,
}: BudgetItemDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [name, setName] = useState(item?.name ?? "");
  const [limit, setLimit] = useState(item ? String(item.monthlyLimit) : "");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(item?.categoryUuids),
  );
  const [isSaving, setIsSaving] = useState(false);

  // 열릴 때와 열린 채로 항목이 바뀔 때 입력값을 되돌린다.
  // effect 대신 렌더 중에 이전 값과 비교한다 (react.dev: 「prop 이 바뀔 때 state 조정하기」)
  const resetKey = open
    ? `${item?.uuid ?? "new"}:${item?.updatedAt ?? ""}`
    : null;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    if (resetKey !== null) {
      setName(item?.name ?? "");
      setLimit(item ? String(item.monthlyLimit) : "");
      setSelected(new Set(item?.categoryUuids));
    }
  }

  const toggleCategory = (categoryUuid: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(categoryUuid)) {
        next.delete(categoryUuid);
      } else {
        next.add(categoryUuid);
      }
      return next;
    });
  };

  const canSave = name.trim() !== "" && selected.size > 0 && !isSaving;

  const handleSave = async () => {
    const input = {
      name: name.trim(),
      monthlyLimit: limit === "" ? 0 : Number(limit),
      categoryUuids: [...selected],
    };
    try {
      setIsSaving(true);
      const result = item
        ? await updateBudgetItemAction(item.uuid, input)
        : await createBudgetItemAction(input);
      if (result.success) {
        toast.success(
          item ? "예산 항목을 수정했어요" : "예산 항목을 만들었어요",
        );
        onOpenChange(false);
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("예산 항목 저장에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const body = (
    <div className="space-y-4 pt-2">
      <div>
        <label
          htmlFor="budget-item-name"
          className="block text-sm font-medium text-fg mb-2"
        >
          이름
        </label>
        <Input
          id="budget-item-name"
          value={name}
          maxLength={NAME_MAX_LENGTH}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 남편 용돈"
        />
      </div>

      <div>
        <label
          htmlFor="budget-item-limit"
          className="block text-sm font-medium text-fg mb-2"
        >
          월 한도 (원)
        </label>
        <Input
          id="budget-item-limit"
          type="text"
          inputMode="numeric"
          value={limit}
          onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))}
          className="num text-lg"
        />
        <p className="mt-1.5 text-xs text-fg-muted">
          0 이면 한도 없이 쓴 금액만 보여요
        </p>
      </div>

      <div>
        <p className="block text-sm font-medium text-fg mb-2">카테고리</p>
        <div className="flex flex-wrap gap-2">
          {expenseCategories.map((category) => {
            const isTaken = takenCategoryUuids.has(category.uuid);
            const isSelected = selected.has(category.uuid);
            return (
              <button
                key={category.uuid}
                type="button"
                aria-pressed={isSelected}
                disabled={isTaken}
                onClick={() => toggleCategory(category.uuid)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  isSelected
                    ? "bg-brand-500 text-brand-fg"
                    : "bg-bg-muted text-fg hover:bg-brand-50 hover:text-brand-700",
                  isTaken && "cursor-not-allowed opacity-50 hover:bg-bg-muted",
                )}
              >
                {category.icon && (
                  <span aria-hidden="true">{category.icon}</span>
                )}
                <span>{category.name}</span>
                {isTaken && (
                  <span className="text-[10px] text-fg-muted">
                    다른 항목에 있음
                  </span>
                )}
              </button>
            );
          })}
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
          disabled={!canSave}
          className="bg-brand-500 hover:bg-brand-600 text-brand-fg"
        >
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );

  const title = item ? "예산 항목 수정" : "예산 항목 추가";

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-auto max-h-[90dvh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {body}
      </SheetContent>
    </Sheet>
  );
}
