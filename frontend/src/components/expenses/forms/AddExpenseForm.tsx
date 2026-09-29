"use client";

import { createExpenseAction } from "@/actions/expense/create-expense-action";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import type { CreateExpenseFormState } from "@/types/expense";
import type { CategoryResponse } from "@/types/category";
import { toLocalDateInput } from "@/lib/utils/format";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { ExpenseFormFields } from "./ExpenseFormFields";

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
  const [amount, setAmount] = useState(0);
  const [categoryUuid, setCategoryUuid] = useState<string | null>(null);
  const [date, setDate] = useState(toLocalDateInput());
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (state.success) {
      toast.success("지출이 추가되었습니다", { description: state.message });
      onSuccess?.();
    } else if (state.message && !state.success) {
      toast.error("오류가 발생했습니다", { description: state.message });
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="familyUuid" value={familyUuid} />
      <ExpenseFormFields
        categories={categories}
        amount={amount}
        onAmountChange={setAmount}
        categoryUuid={categoryUuid}
        onCategoryChange={setCategoryUuid}
        date={date}
        onDateChange={setDate}
        description={description}
        onDescriptionChange={setDescription}
        errors={state.errors}
      />
      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            취소
          </Button>
        )}
        <SubmitButton className="flex-1" pendingText="추가 중...">
          지출 추가
        </SubmitButton>
      </div>
    </form>
  );
}
