/**
 * 지출 수정 다이얼로그
 */

"use client";

import { updateExpenseAction } from "@/app/actions/expense/update-expense-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import type { UpdateExpenseFormState } from "@/types/expense";
import type { CategoryResponse } from "@/types/category";
import { Loader2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: {
    uuid: string;
    amount: string;
    description?: string;
    date: Date | string;
    categoryUuid: string;
  };
  familyUuid: string;
  categories: CategoryResponse[];
  isLoadingCategories?: boolean;
}

const initialState: UpdateExpenseFormState = {
  message: "",
  errors: {},
  success: false,
};

export function EditExpenseDialog({
  open,
  onOpenChange,
  expense,
  familyUuid,
  categories,
  isLoadingCategories = false,
}: EditExpenseDialogProps) {
  const [state, formAction] = useActionState(updateExpenseAction, initialState);

  // 날짜를 YYYY-MM-DD 형식으로 변환
  const dateObj =
    typeof expense.date === "string" ? new Date(expense.date) : expense.date;
  const formattedDate = dateObj.toISOString().split("T")[0];

  // 성공 시 처리
  useEffect(() => {
    if (state.success) {
      toast.success(state.message || "지출이 수정되었습니다");
      onOpenChange(false);
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>지출 수정</DialogTitle>
          <DialogDescription>지출 내역을 수정합니다</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {/* Hidden fields */}
          <input type="hidden" name="expenseUuid" value={expense.uuid} />
          <input type="hidden" name="familyUuid" value={familyUuid} />

          {/* 금액 입력 */}
          <div className="space-y-2">
            <Label htmlFor="amount">금액 *</Label>
            <div className="relative">
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="0"
                defaultValue={expense.amount}
                className="text-right pr-8"
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                원
              </span>
            </div>
            {state.errors?.amount && (
              <p className="text-sm text-red-500">{state.errors.amount[0]}</p>
            )}
          </div>

          {/* 카테고리 선택 */}
          <div className="space-y-2">
            <Label htmlFor="categoryId">카테고리 *</Label>
            {isLoadingCategories ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={expense.categoryUuid}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">카테고리를 선택하세요</option>
                {categories.map((category) => (
                  <option key={category.uuid} value={category.uuid}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            )}
            {state.errors?.categoryId && (
              <p className="text-sm text-red-500">
                {state.errors.categoryId[0]}
              </p>
            )}
          </div>

          {/* 날짜 선택 */}
          <div className="space-y-2">
            <Label htmlFor="date">날짜 *</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={formattedDate}
              required
            />
            {state.errors?.date && (
              <p className="text-sm text-red-500">{state.errors.date[0]}</p>
            )}
          </div>

          {/* 메모 입력 */}
          <div className="space-y-2">
            <Label htmlFor="description">메모</Label>
            <Input
              id="description"
              name="description"
              placeholder="간단한 메모를 입력하세요 (선택사항)"
              defaultValue={expense.description || ""}
            />
            {state.errors?.description && (
              <p className="text-sm text-red-500">
                {state.errors.description[0]}
              </p>
            )}
          </div>

          {/* 버튼들 */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <SubmitButton className="flex-1" pendingText="수정 중...">
              수정하기
            </SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
