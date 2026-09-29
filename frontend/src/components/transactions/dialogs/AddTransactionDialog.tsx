"use client";

import { getFamilyCategoriesAction } from "@/actions/category/get-categories-action";
import { createExpenseAction } from "@/actions/expense/create-expense-action";
import { createIncomeAction } from "@/actions/income/create-income-action";
import { createRecurringExpenseAction } from "@/actions/recurring-expense";
import { cn } from "@/lib/client/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SubmitButton } from "@/components/ui/submit-button";
import { TransactionFormFields } from "@/components/transactions/forms/TransactionFormFields";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { toLocalDateInput } from "@/lib/utils/format";
import type { CreateExpenseFormState } from "@/types/expense";
import type { CreateIncomeFormState } from "@/types/income";
import type { CategoryResponse } from "@/types/category";
import type { TransactionType } from "@/types/transaction";
import { recurringExpenseSchema } from "@/lib/schemas/recurring-expense";
import { TrendingDown, TrendingUp, Repeat } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: TransactionType;
}

// recurring action 시그니처 비호환 처리용 공용 FormState
// TODO: phase-03 이후 공용 타입으로 통합 정리 예정
type FormState = {
  success: boolean;
  errors: Record<string, string[]>;
  message: string;
};

const initialExpenseState: CreateExpenseFormState = { message: "", errors: {}, success: false };
const initialIncomeState: CreateIncomeFormState = { message: "", errors: {}, success: false };
const initialFormState: FormState = { success: false, errors: {}, message: "" };

// createRecurringExpenseAction(data: unknown) → ActionResult 를
// useActionState 호환 (prevState, FormData) → FormState 로 변환하는 wrapper.
// 검증 schema 는 server action 과 공용 (recurringExpenseSchema) — 즉시 피드백 + 시그니처 변환 목적
async function createRecurringWrapper(_prev: FormState, fd: FormData): Promise<FormState> {
  const raw = {
    name: String(fd.get("name") ?? ""),
    categoryUuid: String(fd.get("categoryUuid") ?? ""),
    amount: Number(fd.get("amount")),
    dayOfMonth: Number(fd.get("dayOfMonth")),
  };
  const parsed = recurringExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_form");
      (errors[key] ??= []).push(issue.message);
    }
    return { success: false, errors, message: "" };
  }
  const result = await createRecurringExpenseAction(parsed.data);
  return result.success
    ? { success: true, errors: {}, message: "고정지출이 등록되었습니다" }
    : { success: false, errors: { _form: [result.error?.message ?? "등록 실패"] }, message: "" };
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  defaultType = "expense",
}: AddTransactionDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // open && <Body /> — useActionState / useState 자동 reset 으로 stale state 회피 (PR #233 패턴)
  const body = open ? (
    <AddTransactionDialogBody onOpenChange={onOpenChange} defaultType={defaultType} />
  ) : null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[720px] bg-bg-elev">
          <DialogHeader>
            <DialogTitle className="sr-only">거래 추가</DialogTitle>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[100dvh] p-0 bg-bg-elev">
        <SheetHeader className="px-5 py-3 border-b border-border">
          <SheetTitle>거래 추가</SheetTitle>
        </SheetHeader>
        <div className="px-5 py-4 overflow-y-auto h-[calc(100dvh-56px)]">{body}</div>
      </SheetContent>
    </Sheet>
  );
}

interface AddTransactionDialogBodyProps {
  onOpenChange: (open: boolean) => void;
  defaultType: TransactionType;
}

function AddTransactionDialogBody({ onOpenChange, defaultType }: AddTransactionDialogBodyProps) {
  const [activeTypeDraft, setActiveTypeDraft] = useState<TransactionType | null>(null);
  const activeType = activeTypeDraft ?? defaultType;

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // 공용 필드
  const [amount, setAmount] = useState(0);
  const [categoryUuid, setCategoryUuid] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  // expense/income 전용
  const [date, setDate] = useState(toLocalDateInput());

  // recurring 전용
  const [name, setName] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState<number | undefined>(undefined);

  const [expenseState, expenseFormAction] = useActionState(createExpenseAction, initialExpenseState);
  const [incomeState, incomeFormAction] = useActionState(createIncomeAction, initialIncomeState);
  const [recurringState, recurringFormAction] = useActionState(
    createRecurringWrapper,
    initialFormState,
  );

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingCategories(true);
    getFamilyCategoriesAction()
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setCategories(result.data);
        } else {
          toast.error(result.error.message);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("카테고리를 불러오는데 실패했습니다");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCategories(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (expenseState.success) {
      toast.success(expenseState.message);
      onOpenChange(false);
    } else if (expenseState.message && !expenseState.success) {
      toast.error(expenseState.message);
    }
  }, [expenseState, onOpenChange]);

  useEffect(() => {
    if (incomeState.success) {
      toast.success(incomeState.message);
      onOpenChange(false);
    } else if (incomeState.message && !incomeState.success) {
      toast.error(incomeState.message);
    }
  }, [incomeState, onOpenChange]);

  useEffect(() => {
    if (recurringState.success) {
      toast.success(recurringState.message);
      onOpenChange(false);
    } else if (recurringState.message && !recurringState.success) {
      toast.error(recurringState.message);
    }
  }, [recurringState, onOpenChange]);

  // type 전환 시: amount/category/description 유지, type-specific 필드만 초기화 (ADR-F21)
  function handleTypeChange(type: TransactionType) {
    setActiveTypeDraft(type);
    // recurring ↔ expense/income 전환 시 전용 필드 초기화
    setName("");
    setDayOfMonth(undefined);
    setDate(toLocalDateInput());
  }

  const formAction =
    activeType === "expense"
      ? expenseFormAction
      : activeType === "income"
        ? incomeFormAction
        : recurringFormAction;

  const errors =
    activeType === "expense"
      ? expenseState.errors
      : activeType === "income"
        ? incomeState.errors
        : recurringState.errors;

  const ctaGradient =
    activeType === "expense"
      ? "gradient-expense text-expense-fg"
      : activeType === "income"
        ? "gradient-income text-income-fg"
        : "gradient-budget text-brand-fg";

  const ctaLabel =
    activeType === "expense" ? "지출" : activeType === "income" ? "수입" : "고정지출";

  return (
    <form action={formAction} className="space-y-5">
      {/* 3 segmented 토글 */}
      <div className="flex gap-1 bg-bg-muted p-1 rounded-xl">
        <button
          type="button"
          onClick={() => handleTypeChange("expense")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all",
            activeType === "expense"
              ? "gradient-expense text-expense-fg shadow-sm"
              : "text-fg-muted hover:text-fg",
          )}
        >
          <TrendingDown className="w-4 h-4" />
          지출
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("income")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all",
            activeType === "income"
              ? "gradient-income text-income-fg shadow-sm"
              : "text-fg-muted hover:text-fg",
          )}
        >
          <TrendingUp className="w-4 h-4" />
          수입
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("recurring")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all",
            activeType === "recurring"
              ? "gradient-budget text-brand-fg shadow-sm"
              : "text-fg-muted hover:text-fg",
          )}
        >
          <Repeat className="w-4 h-4" />
          고정지출
        </button>
      </div>

      <TransactionFormFields
        type={activeType}
        categories={categories}
        amount={amount}
        onAmountChange={setAmount}
        categoryUuid={categoryUuid}
        onCategoryChange={setCategoryUuid}
        description={description}
        onDescriptionChange={setDescription}
        date={date}
        onDateChange={setDate}
        name={name}
        onNameChange={setName}
        dayOfMonth={dayOfMonth}
        onDayOfMonthChange={setDayOfMonth}
        isLoadingCategories={isLoadingCategories}
        errors={errors}
      />

      {/* _form 레벨 에러 (recurring wrapper 전용) */}
      {activeType === "recurring" && recurringState.errors._form && (
        <p className="text-sm text-expense">{recurringState.errors._form[0]}</p>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
          취소
        </Button>
        <SubmitButton
          className={cn("flex-1 hover:opacity-90", ctaGradient)}
          pendingText="추가 중..."
        >
          {ctaLabel} 추가
        </SubmitButton>
      </div>
    </form>
  );
}
