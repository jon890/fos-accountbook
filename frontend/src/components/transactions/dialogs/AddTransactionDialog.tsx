"use client";

import { getFamilyCategoriesAction } from "@/actions/category/get-categories-action";
import { createExpenseAction } from "@/actions/expense/create-expense-action";
import { createIncomeAction } from "@/actions/income/create-income-action";
import { createRecurringExpenseAction } from "@/actions/recurring-expense";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/client/utils";
import { getMissingField, MISSING_FIELD_MESSAGE } from "@/lib/client/transaction-form-readiness";
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
import { useTransactionSheetViewport } from "@/hooks/useTransactionSheetViewport";
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
  defaultDate?: string;
}

// recurring action 시그니처 비호환 처리용 공용 FormState
type FormState = {
  success: boolean;
  errors: Record<string, string[]>;
  message: string;
};

const initialExpenseState: CreateExpenseFormState = {
  message: "",
  errors: {},
  success: false,
};
const initialIncomeState: CreateIncomeFormState = {
  message: "",
  errors: {},
  success: false,
};
const initialFormState: FormState = { success: false, errors: {}, message: "" };

// createRecurringExpenseAction(data: unknown) → ActionResult 를
// useActionState 호환 (prevState, FormData) → FormState 로 변환하는 wrapper.
// 검증 schema 는 server action 과 공용 (recurringExpenseSchema) — 즉시 피드백 + 시그니처 변환 목적
async function createRecurringWrapper(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const dayOfMonth = fd.get("dayOfMonth");
  if (dayOfMonth === null || dayOfMonth === "") {
    return {
      success: false,
      errors: { dayOfMonth: [MISSING_FIELD_MESSAGE.dayOfMonth] },
      message: "",
    };
  }

  const raw = {
    name: String(fd.get("name") ?? ""),
    categoryUuid: String(fd.get("categoryUuid") ?? ""),
    amount: Number(fd.get("amount")),
    dayOfMonth: Number(dayOfMonth),
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
    : {
        success: false,
        errors: { _form: [result.error?.message ?? "등록 실패"] },
        message: "",
      };
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  defaultType = "expense",
  defaultDate,
}: AddTransactionDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const sheetStyle = useTransactionSheetViewport(open, isDesktop);

  // open && <Body /> — useActionState / useState 자동 reset 으로 stale state 회피 (PR #233 패턴)
  const body = open ? (
    <AddTransactionDialogBody
      key={defaultDate ?? "today"}
      onOpenChange={onOpenChange}
      defaultType={defaultType}
      defaultDate={defaultDate}
    />
  ) : null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] max-w-[720px] flex flex-col overflow-hidden bg-bg-elev">
          <DialogHeader>
            <DialogTitle>거래 추가</DialogTitle>
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
        style={sheetStyle}
        className="h-[100dvh] p-0 gap-0 bg-bg-elev"
      >
        <SheetHeader className="px-5 py-3 border-b border-border">
          <SheetTitle>거래 추가</SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col">{body}</div>
      </SheetContent>
    </Sheet>
  );
}

interface AddTransactionDialogBodyProps {
  onOpenChange: (open: boolean) => void;
  defaultType: TransactionType;
  defaultDate?: string;
}

function AddTransactionDialogBody({
  onOpenChange,
  defaultType,
  defaultDate,
}: AddTransactionDialogBodyProps) {
  const [activeTypeDraft, setActiveTypeDraft] =
    useState<TransactionType | null>(null);
  const activeType = activeTypeDraft ?? defaultType;

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // 공용 필드
  const [amount, setAmount] = useState(0);
  const [categoryUuid, setCategoryUuid] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [excludeFromBudget, setExcludeFromBudget] = useState(false);

  // expense/income 전용
  const [date, setDate] = useState(() => defaultDate ?? toLocalDateInput());

  // recurring 전용
  const [name, setName] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState<number | undefined>(undefined);

  const [expenseState, expenseFormAction, isExpensePending] = useActionState(
    createExpenseAction,
    initialExpenseState,
  );
  const [incomeState, incomeFormAction, isIncomePending] = useActionState(
    createIncomeAction,
    initialIncomeState,
  );
  const [recurringState, recurringFormAction, isRecurringPending] =
    useActionState(createRecurringWrapper, initialFormState);

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

  // 선택 날짜와 공용 입력은 유지하고 고정지출 전용 입력만 초기화한다.
  function handleTypeChange(type: TransactionType) {
    setActiveTypeDraft(type);
    setCategoryUuid(null);
    // recurring ↔ expense/income 전환 시 전용 필드 초기화
    setName("");
    setDayOfMonth(undefined);
  }

  let formAction = recurringFormAction;
  let errors: Record<string, string[] | undefined> | undefined =
    recurringState.errors;
  let ctaLabel = "고정지출";

  if (activeType === "expense") {
    formAction = expenseFormAction;
    errors = expenseState.errors;
    ctaLabel = "지출";
  } else if (activeType === "income") {
    formAction = incomeFormAction;
    errors = incomeState.errors;
    ctaLabel = "수입";
  }

  const isPending = isExpensePending || isIncomePending || isRecurringPending;
  const missingField = getMissingField({
    type: activeType,
    amount,
    categoryUuid,
    date,
    name,
    dayOfMonth,
  });

  return (
    <form action={formAction} className="flex min-h-0 flex-1 flex-col">
      <fieldset disabled={isPending} className="contents">
        <div className="space-y-5 overflow-y-auto min-h-0 flex-1 px-5 py-4 md:p-0">
          {/* 3 segmented 토글 */}
          <RadioGroup
            value={activeType}
            onValueChange={(value) =>
              handleTypeChange(value as TransactionType)
            }
            aria-label="거래 종류"
            className="flex gap-1 rounded-xl bg-bg-muted p-1"
          >
            <RadioGroupItem
              value="expense"
              className={cn(
                "aspect-auto flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border-0 py-2 text-sm font-semibold shadow-none transition-all",
                activeType === "expense"
                  ? "gradient-expense text-expense-fg shadow-sm"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              <TrendingDown className="w-4 h-4" />
              지출
            </RadioGroupItem>
            <RadioGroupItem
              value="income"
              className={cn(
                "aspect-auto flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border-0 py-2 text-sm font-semibold shadow-none transition-all",
                activeType === "income"
                  ? "gradient-income text-income-fg shadow-sm"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              <TrendingUp className="w-4 h-4" />
              수입
            </RadioGroupItem>
            <RadioGroupItem
              value="recurring"
              className={cn(
                "aspect-auto flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border-0 py-2 text-sm font-semibold shadow-none transition-all",
                activeType === "recurring"
                  ? "gradient-primary text-brand-fg shadow-sm"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              <Repeat className="w-4 h-4" />
              고정지출
            </RadioGroupItem>
          </RadioGroup>

          <TransactionFormFields
            type={activeType}
            categories={categories}
            amount={amount}
            onAmountChange={setAmount}
            categoryUuid={categoryUuid}
            onCategoryChange={setCategoryUuid}
            description={description}
            onDescriptionChange={setDescription}
            excludeFromBudget={excludeFromBudget}
            onExcludeFromBudgetChange={setExcludeFromBudget}
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
            <p className="text-sm text-expense">
              {recurringState.errors._form[0]}
            </p>
          )}
        </div>
        <div className="sticky bottom-0 shrink-0 bg-bg-elev px-5 pt-4 safe-area-pb md:static md:px-0">
          {missingField && (
            <p
              id="transaction-form-missing-field"
              className="mb-2 text-xs text-fg-muted"
            >
              {MISSING_FIELD_MESSAGE[missingField]}
            </p>
          )}
          <div className="flex gap-2 pb-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <SubmitButton
              disabled={missingField !== null}
              aria-describedby={
                missingField ? "transaction-form-missing-field" : undefined
              }
              className={cn("flex-1 hover:opacity-90", {
                "gradient-expense text-expense-fg": activeType === "expense",
                "gradient-income text-income-fg": activeType === "income",
                "gradient-primary text-brand-fg": activeType !== "expense" && activeType !== "income",
              })}
              pendingText="추가 중..."
            >
              {ctaLabel} 추가
            </SubmitButton>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
