"use client";

import { updateExpenseAction } from "@/actions/expense/update-expense-action";
import { updateIncomeAction } from "@/actions/income/update-income-action";
import { updateRecurringExpenseAction } from "@/actions/recurring-expense";
import { getFamilyCategoriesAction } from "@/actions/category/get-categories-action";
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
import type { UpdateExpenseFormState, Expense } from "@/types/expense";
import type { UpdateIncomeFormState, Income } from "@/types/income";
import type { RecurringExpense } from "@/types/recurring-expense";
import type { CategoryResponse } from "@/types/category";
import type { TransactionType } from "@/types/transaction";
import { recurringExpenseSchema } from "@/lib/schemas/recurring-expense";
import { TrendingDown, TrendingUp, Repeat } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

type TransactionUnion = Expense | Income | RecurringExpense;

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: TransactionType;
  transaction: TransactionUnion;
  familyUuid?: string;
}

// recurring update action 시그니처 비호환 처리용 공용 FormState
type FormState = {
  success: boolean;
  errors: Record<string, string[]>;
  message: string;
};

const initialExpenseState: UpdateExpenseFormState = { message: "", errors: {}, success: false };
const initialIncomeState: UpdateIncomeFormState = { message: "", errors: {}, success: false };
const initialFormState: FormState = { success: false, errors: {}, message: "" };

function isRecurringExpense(t: TransactionUnion): t is RecurringExpense {
  return "dayOfMonth" in t;
}

function getDateInitial(t: TransactionUnion): string {
  return isRecurringExpense(t) ? "" : toLocalDateInput(t.date);
}

function getDescriptionInitial(t: TransactionUnion): string {
  return isRecurringExpense(t) ? "" : (t.description ?? "");
}

async function updateRecurringWrapper(_prev: FormState, fd: FormData): Promise<FormState> {
  const uuid = String(fd.get("uuid") ?? "");
  const raw = {
    name: String(fd.get("name") ?? ""),
    categoryUuid: String(fd.get("categoryUuid") ?? ""),
    amount: Number(fd.get("amount")),
    dayOfMonth: Number(fd.get("dayOfMonth")),
  };
  const parsed = recurringExpenseSchema.partial().safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_form");
      (errors[key] ??= []).push(issue.message);
    }
    return { success: false, errors, message: "" };
  }
  const result = await updateRecurringExpenseAction(uuid, parsed.data);
  return result.success
    ? { success: true, errors: {}, message: "고정지출이 수정되었습니다" }
    : { success: false, errors: { _form: [result.error.message ?? "수정 실패"] }, message: "" };
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  type,
  transaction,
  familyUuid,
}: EditTransactionDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const title =
    type === "expense" ? "지출 수정" : type === "income" ? "수입 수정" : "고정지출 수정";

  const body = open ? (
    <EditTransactionDialogBody
      type={type}
      transaction={transaction}
      familyUuid={familyUuid}
      onOpenChange={onOpenChange}
    />
  ) : null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[720px] bg-bg-elev">
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
      <SheetContent side="bottom" className="h-[100dvh] p-0 bg-bg-elev">
        <SheetHeader className="px-5 py-3 border-b border-border">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="px-5 py-4 overflow-y-auto h-[calc(100dvh-56px)]">{body}</div>
      </SheetContent>
    </Sheet>
  );
}

interface EditTransactionDialogBodyProps {
  type: TransactionType;
  transaction: TransactionUnion;
  familyUuid?: string;
  onOpenChange: (open: boolean) => void;
}

function EditTransactionDialogBody({
  type,
  transaction,
  familyUuid,
  onOpenChange,
}: EditTransactionDialogBodyProps) {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const recurring = isRecurringExpense(transaction) ? transaction : null;

  const [amount, setAmount] = useState(Number(transaction.amount));
  const [categoryUuid, setCategoryUuid] = useState<string | null>(transaction.categoryUuid);
  const [date, setDate] = useState(() => getDateInitial(transaction));
  const [description, setDescription] = useState(() => getDescriptionInitial(transaction));
  const [name, setName] = useState(recurring?.name ?? "");
  const [dayOfMonth, setDayOfMonth] = useState<number | undefined>(recurring?.dayOfMonth);

  const [expenseState, expenseFormAction] = useActionState(updateExpenseAction, initialExpenseState);
  const [incomeState, incomeFormAction] = useActionState(updateIncomeAction, initialIncomeState);
  const [recurringState, recurringFormAction] = useActionState(
    updateRecurringWrapper,
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
      toast.success(expenseState.message || "지출이 수정되었습니다");
      onOpenChange(false);
    } else if (expenseState.message && !expenseState.success) {
      toast.error(expenseState.message);
    }
  }, [expenseState, onOpenChange]);

  useEffect(() => {
    if (incomeState.success) {
      toast.success(incomeState.message || "수입이 수정되었습니다");
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

  const formAction =
    type === "expense"
      ? expenseFormAction
      : type === "income"
        ? incomeFormAction
        : recurringFormAction;

  const errors =
    type === "expense"
      ? expenseState.errors
      : type === "income"
        ? incomeState.errors
        : recurringState.errors;

  const ctaGradient =
    type === "expense"
      ? "gradient-expense text-expense-fg"
      : type === "income"
        ? "gradient-income text-income-fg"
        : "gradient-budget text-brand-fg";

  const ctaLabel = type === "expense" ? "지출" : type === "income" ? "수입" : "고정지출";

  return (
    <form action={formAction} className="space-y-5">
      {/* type-specific hidden fields */}
      {type === "expense" && (
        <>
          <input type="hidden" name="expenseUuid" value={transaction.uuid} />
          {familyUuid && <input type="hidden" name="familyUuid" value={familyUuid} />}
        </>
      )}
      {type === "income" && (
        <>
          <input type="hidden" name="incomeUuid" value={transaction.uuid} />
          {familyUuid && <input type="hidden" name="familyUuid" value={familyUuid} />}
        </>
      )}
      {type === "recurring" && <input type="hidden" name="uuid" value={transaction.uuid} />}

      {/* 3 segmented 토글 — 현재 type 만 활성, 나머지 disabled */}
      <div className="flex gap-1 bg-bg-muted p-1 rounded-xl">
        <button
          type="button"
          disabled={type !== "expense"}
          aria-disabled={type !== "expense"}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all",
            type === "expense"
              ? "gradient-expense text-expense-fg shadow-sm"
              : "text-fg-muted opacity-40 cursor-not-allowed",
          )}
        >
          <TrendingDown className="w-4 h-4" />
          지출
        </button>
        <button
          type="button"
          disabled={type !== "income"}
          aria-disabled={type !== "income"}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all",
            type === "income"
              ? "gradient-income text-income-fg shadow-sm"
              : "text-fg-muted opacity-40 cursor-not-allowed",
          )}
        >
          <TrendingUp className="w-4 h-4" />
          수입
        </button>
        <button
          type="button"
          disabled={type !== "recurring"}
          aria-disabled={type !== "recurring"}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all",
            type === "recurring"
              ? "gradient-budget text-brand-fg shadow-sm"
              : "text-fg-muted opacity-40 cursor-not-allowed",
          )}
        >
          <Repeat className="w-4 h-4" />
          고정지출
        </button>
      </div>

      <TransactionFormFields
        type={type}
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

      {type === "recurring" && recurringState.errors._form && (
        <p className="text-sm text-expense">{recurringState.errors._form[0]}</p>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => onOpenChange(false)}
        >
          취소
        </Button>
        <SubmitButton
          className={cn("flex-1 hover:opacity-90", ctaGradient)}
          pendingText="수정 중..."
        >
          {ctaLabel} 수정
        </SubmitButton>
      </div>
    </form>
  );
}
