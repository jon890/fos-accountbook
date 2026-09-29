"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AmountInput } from "./AmountInput";
import { CategoryGrid } from "./CategoryGrid";
import type { CategoryResponse } from "@/types/category";

interface ExpenseFormFieldsProps {
  categories: CategoryResponse[];
  amount: number;
  onAmountChange: (next: number) => void;
  categoryUuid: string | null;
  onCategoryChange: (uuid: string) => void;
  date: string;
  onDateChange: (next: string) => void;
  description: string;
  onDescriptionChange: (next: string) => void;
  isLoadingCategories?: boolean;
  errors?: {
    amount?: string[];
    categoryId?: string[];
    date?: string[];
    description?: string[];
  };
  disabled?: boolean;
}

export function ExpenseFormFields({
  categories,
  amount,
  onAmountChange,
  categoryUuid,
  onCategoryChange,
  date,
  onDateChange,
  description,
  onDescriptionChange,
  isLoadingCategories,
  errors,
  disabled,
}: ExpenseFormFieldsProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="amount">금액 *</Label>
        <AmountInput id="amount" value={amount} onChange={onAmountChange} disabled={disabled} />
        <input type="hidden" name="amount" value={amount} />
        {errors?.amount && <p className="text-sm text-expense">{errors.amount[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label>카테고리 *</Label>
        {isLoadingCategories ? (
          <div className="h-20 flex items-center justify-center text-sm text-fg-muted">
            카테고리를 불러오는 중...
          </div>
        ) : (
          <CategoryGrid
            categories={categories}
            selectedUuid={categoryUuid}
            onSelect={onCategoryChange}
            disabled={disabled}
          />
        )}
        <input type="hidden" name="categoryId" value={categoryUuid ?? ""} />
        {errors?.categoryId && <p className="text-sm text-expense">{errors.categoryId[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">날짜 *</Label>
        <Input
          id="date"
          name="date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          disabled={disabled}
          required
        />
        {errors?.date && <p className="text-sm text-expense">{errors.date[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">메모</Label>
        <Input
          id="description"
          name="description"
          placeholder="간단한 메모 (선택사항)"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          disabled={disabled}
        />
        {errors?.description && <p className="text-sm text-expense">{errors.description[0]}</p>}
      </div>
    </div>
  );
}
