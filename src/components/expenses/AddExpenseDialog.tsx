/**
 * 지출 추가 다이얼로그
 */

"use client";

import { getFamilyCategories } from "@/app/actions/dashboard-actions";
import { createExpenseAction } from "@/app/actions/expense-actions";
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
import type { CreateExpenseFormState } from "@/types/actions";
import type { CategoryResponse } from "@/types/api";
import { Loader2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialState: CreateExpenseFormState = {
  message: "",
  errors: {},
  success: false,
};

export function AddExpenseDialog({
  open,
  onOpenChange,
}: AddExpenseDialogProps) {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [familyUuid, setFamilyUuid] = useState<string>("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [state, formAction] = useActionState(createExpenseAction, initialState);

  // 컴포넌트 마운트 시 즉시 카테고리 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoadingCategories(true);
    try {
      const data = await getFamilyCategories();
      setCategories(data);
      // 첫 번째 카테고리의 familyUuid 사용
      if (data.length > 0) {
        setFamilyUuid(data[0].familyUuid);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("카테고리를 불러오는데 실패했습니다");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // 성공 시 처리
  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      onOpenChange(false);
      // 폼 리셋을 위해 state 초기화
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>지출 추가</DialogTitle>
          <DialogDescription>새로운 지출 내역을 추가합니다</DialogDescription>
        </DialogHeader>

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
            {isLoadingCategories ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              <select
                id="categoryId"
                name="categoryId"
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
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" className="flex-1">
              지출 추가
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
