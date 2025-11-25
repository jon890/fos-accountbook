"use client";

import { createExpenseAction } from "@/app/actions/expense/create-expense-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import type { CreateExpenseFormState } from "@/types/expense";
import type { CategoryResponse } from "@/types/category";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

interface AddExpenseFormProps {
  categories: CategoryResponse[];
  familyUuid: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const initialState: CreateExpenseFormState = {
  message: "",
  errors: {},
  success: false,
};

export function AddExpenseForm({
  categories,
  familyUuid,
  onSuccess,
  onCancel,
}: AddExpenseFormProps) {
  const [state, formAction] = useActionState(createExpenseAction, initialState);

  // 성공 시 처리
  useEffect(() => {
    if (state.success) {
      toast.success("지출이 추가되었습니다", {
        description: state.message,
      });
      onSuccess?.();
    } else if (state.message && !state.success) {
      toast.error("오류가 발생했습니다", {
        description: state.message,
      });
    }
  }, [state, onSuccess]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">지출 추가</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* familyUuid hidden input */}
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
            <select
              id="categoryId"
              name="categoryId"
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">카테고리를 선택하세요</option>
              {categories.map((category) => (
                <option key={category.uuid} value={category.uuid}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
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
              defaultValue={new Date().toISOString().split("T")[0]}
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
            />
            {state.errors?.description && (
              <p className="text-sm text-red-500">
                {state.errors.description[0]}
              </p>
            )}
          </div>

          {/* 버튼들 */}
          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onCancel}
              >
                취소
              </Button>
            )}
            <SubmitButton className="flex-1" pendingText="추가 중...">
              지출 추가
            </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
