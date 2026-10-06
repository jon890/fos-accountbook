"use client";

import { deleteBudgetItemAction } from "@/actions/budget-item/delete-budget-item-action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";
import type { BudgetItem } from "@/types/budget-item";
import type { CategoryResponse } from "@/types/category";
import { Plus } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { toast } from "sonner";
import { BudgetItemDialog } from "./BudgetItemDialog";

const MAX_BUDGET_ITEMS = 10;

interface BudgetItemsSectionProps {
  items: BudgetItem[];
  monthlyBudget: number;
  expenseCategories: CategoryResponse[];
  failed: boolean;
}

export function BudgetItemsSection({
  items,
  monthlyBudget,
  expenseCategories,
  failed,
}: BudgetItemsSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetItem | undefined>();
  const [deleting, setDeleting] = useState<BudgetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryNames = new Map(
    expenseCategories.map((category) => [category.uuid, category.name]),
  );
  // 수정 중인 항목 자신의 카테고리는 다시 고를 수 있어야 하므로 뺀다
  const takenCategoryUuids = new Set(
    items
      .filter((item) => item.uuid !== editing?.uuid)
      .flatMap((item) => item.categoryUuids),
  );
  const isFull = items.length >= MAX_BUDGET_ITEMS;
  // 예산 요약 API 의 living.limit 과 같은 식이다 (ADR-B26)
  const itemLimitSum = items.reduce((sum, item) => sum + item.monthlyLimit, 0);
  const livingLimit = Math.max(monthlyBudget - itemLimitSum, 0);

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openEdit = (item: BudgetItem) => {
    setEditing(item);
    setDialogOpen(true);
  };

  const handleDelete = async (event: MouseEvent) => {
    // 기본 동작은 확인 즉시 닫으므로, 삭제가 끝날 때까지 열어 둔다
    event.preventDefault();
    if (!deleting) return;
    try {
      setIsDeleting(true);
      const result = await deleteBudgetItemAction(deleting.uuid);
      if (result.success) {
        toast.success("예산 항목을 삭제했어요");
        setDeleting(null);
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("예산 항목 삭제에 실패했습니다");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="bg-bg-elev border-border">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-fg">예산 항목</h2>
          {!failed && (
            <Button
              size="sm"
              variant="outline"
              onClick={openCreate}
              disabled={isFull}
            >
              <Plus className="w-4 h-4" />
              항목 추가
            </Button>
          )}
        </div>

        {failed && (
          <p className="py-6 text-center text-sm text-fg-muted">
            예산 항목을 불러오지 못했어요
          </p>
        )}

        {!failed && isFull && (
          <p className="text-xs text-fg-muted">
            예산 항목은 10개까지 만들 수 있어요
          </p>
        )}

        {!failed && monthlyBudget > 0 && itemLimitSum <= monthlyBudget && (
          <p className="num text-xs text-fg-muted">
            생활비 {formatCurrency(livingLimit)} = 예산 {formatCurrency(monthlyBudget)} −
            항목 {formatCurrency(itemLimitSum)}
          </p>
        )}

        {!failed && monthlyBudget > 0 && itemLimitSum > monthlyBudget && (
          <p className="num text-xs text-expense">
            항목 한도가 예산을 넘었어요. 예산 {formatCurrency(monthlyBudget)}, 항목{" "}
            {formatCurrency(itemLimitSum)}
          </p>
        )}

        {!failed && items.length === 0 && (
          <p className="py-6 text-center text-sm text-fg-muted">
            용돈처럼 따로 관리할 지출을 예산 항목으로 만들어 보세요
          </p>
        )}

        {!failed && items.length > 0 && (
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const names = item.categoryUuids
                .map((uuid) => categoryNames.get(uuid))
                .filter((name): name is string => name !== undefined);
              return (
                <li
                  key={item.uuid}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-fg">{item.name}</p>
                    <p className="num text-xs text-fg-muted">
                      {item.monthlyLimit > 0
                        ? formatCurrency(item.monthlyLimit)
                        : "한도 없음"}
                    </p>
                    <p className="truncate text-xs text-fg-muted">
                      {names.length > 0 ? names.join(", ") : "카테고리 없음"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(item)}
                      aria-label={`${item.name} 수정`}
                    >
                      수정
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleting(item)}
                      aria-label={`${item.name} 삭제`}
                    >
                      삭제
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <BudgetItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        expenseCategories={expenseCategories}
        takenCategoryUuids={takenCategoryUuids}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>예산 항목 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &apos;{deleting?.name}&apos; 항목을 삭제할까요? 이 항목의 지출은
              다시 생활비에 들어갑니다
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
