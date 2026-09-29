"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AmountInput } from "@/components/expenses/forms/AmountInput";
import { CategoryGrid } from "@/components/expenses/forms/CategoryGrid";
import type { CategoryResponse } from "@/types/category";
import type { TransactionType } from "@/types/transaction";

interface TransactionFormFieldsProps {
  type: TransactionType;
  categories: CategoryResponse[];
  // 공용
  amount: number;
  onAmountChange: (n: number) => void;
  categoryUuid: string | null;
  onCategoryChange: (uuid: string | null) => void;
  description: string;
  onDescriptionChange: (s: string) => void;
  // expense/income 만
  date?: string;
  onDateChange?: (s: string) => void;
  // recurring 만
  name?: string;
  onNameChange?: (s: string) => void;
  dayOfMonth?: number;
  onDayOfMonthChange?: (n: number) => void;
  // 공통
  isLoadingCategories: boolean;
  errors?: Record<string, string[] | undefined>;
}

export function TransactionFormFields({
  type,
  categories,
  amount,
  onAmountChange,
  categoryUuid,
  onCategoryChange,
  description,
  onDescriptionChange,
  date,
  onDateChange,
  name,
  onNameChange,
  dayOfMonth,
  onDayOfMonthChange,
  isLoadingCategories,
  errors,
}: TransactionFormFieldsProps) {
  const isRecurring = type === "recurring";

  return (
    <div className="space-y-5">
      {/* 금액 (공용) */}
      <div className="space-y-2">
        <Label htmlFor="amount">금액 *</Label>
        <AmountInput id="amount" value={amount} onChange={onAmountChange} />
        <input type="hidden" name="amount" value={amount} />
        {errors?.amount && <p className="text-sm text-expense">{errors.amount[0]}</p>}
      </div>

      {/* 카테고리 (공용) */}
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
          />
        )}
        {/* expense/income → categoryId, recurring → categoryUuid (각 action 스키마에 맞춤) */}
        {isRecurring ? (
          <input type="hidden" name="categoryUuid" value={categoryUuid ?? ""} />
        ) : (
          <input type="hidden" name="categoryId" value={categoryUuid ?? ""} />
        )}
        {errors?.categoryId && <p className="text-sm text-expense">{errors.categoryId[0]}</p>}
        {errors?.categoryUuid && <p className="text-sm text-expense">{errors.categoryUuid[0]}</p>}
      </div>

      {/* recurring 전용: 이름 + 결제일 */}
      {isRecurring && (
        <>
          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              name="name"
              placeholder="예: 넷플릭스, 월세"
              value={name ?? ""}
              onChange={(e) => onNameChange?.(e.target.value)}
              required
            />
            {errors?.name && <p className="text-sm text-expense">{errors.name[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dayOfMonth">매월 결제일 *</Label>
            <div className="relative">
              <Input
                id="dayOfMonth"
                name="dayOfMonth"
                type="number"
                placeholder="1"
                min={1}
                max={28}
                className="pr-8"
                value={dayOfMonth ?? ""}
                onChange={(e) => onDayOfMonthChange?.(Number(e.target.value))}
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fg-muted">
                일
              </span>
            </div>
            <p className="text-xs text-fg-subtle">1~28일까지 선택 가능합니다</p>
            {errors?.dayOfMonth && <p className="text-sm text-expense">{errors.dayOfMonth[0]}</p>}
          </div>
        </>
      )}

      {/* expense/income 전용: 날짜 */}
      {!isRecurring && (
        <div className="space-y-2">
          <Label htmlFor="date">날짜 *</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={date ?? ""}
            onChange={(e) => onDateChange?.(e.target.value)}
            required
          />
          {errors?.date && <p className="text-sm text-expense">{errors.date[0]}</p>}
        </div>
      )}

      {/* 메모 — recurring 에서는 숨김 (createRecurringExpenseSchema 에 description 없음) */}
      {!isRecurring && (
        <div className="space-y-2">
          <Label htmlFor="description">메모</Label>
          <Input
            id="description"
            name="description"
            placeholder="간단한 메모 (선택사항)"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
          {errors?.description && <p className="text-sm text-expense">{errors.description[0]}</p>}
        </div>
      )}
    </div>
  );
}
