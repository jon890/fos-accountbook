"use client";

import { createInstallmentAction } from "@/actions/installment/create-installment-action";
import { deleteInstallmentAction } from "@/actions/installment/delete-installment-action";
import { updateInstallmentAction } from "@/actions/installment/update-installment-action";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useAppRouter } from "@/lib/client/navigation";
import { formatCurrency } from "@/lib/utils/format";
import type { Installment, InstallmentInput } from "@/types/installment";
import { useState, type MouseEvent } from "react";
import { toast } from "sonner";

const NAME_MAX_LENGTH = 50;
const MEMO_MAX_LENGTH = 200;

interface InstallmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 있으면 수정, 없으면 등록 */
  installment?: Installment;
  /** 등록할 때 첫 결제 월의 기본값 (YYYY-MM) */
  defaultStartMonth: string;
}

export function InstallmentDialog({
  open,
  onOpenChange,
  installment,
  defaultStartMonth,
}: InstallmentDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const router = useAppRouter();
  const [name, setName] = useState(installment?.name ?? "");
  const [total, setTotal] = useState(
    installment ? String(installment.totalAmount) : "",
  );
  const [months, setMonths] = useState(
    installment ? String(installment.installmentMonths) : "",
  );
  const [startMonth, setStartMonth] = useState(
    installment?.startMonth ?? defaultStartMonth,
  );
  const [memo, setMemo] = useState(installment?.memo ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // 열릴 때와 열린 채로 할부가 바뀔 때 입력값을 되돌린다.
  // effect 대신 렌더 중에 이전 값과 비교한다 (react.dev: 「prop 이 바뀔 때 state 조정하기」)
  const resetKey = open
    ? `${installment?.uuid ?? "new"}:${installment?.updatedAt ?? ""}`
    : null;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    if (resetKey !== null) {
      setName(installment?.name ?? "");
      setTotal(installment ? String(installment.totalAmount) : "");
      setMonths(installment ? String(installment.installmentMonths) : "");
      setStartMonth(installment?.startMonth ?? defaultStartMonth);
      setMemo(installment?.memo ?? "");
    }
  }

  const canSave =
    name.trim() !== "" &&
    total !== "" &&
    months !== "" &&
    startMonth !== "" &&
    !isSaving;

  const totalNumber = Number(total);
  const monthsNumber = Number(months);
  const showPreview = total !== "" && months !== "" && monthsNumber >= 2;
  const monthly = showPreview ? Math.floor(totalNumber / monthsNumber) : 0;
  const first = showPreview ? totalNumber - monthly * (monthsNumber - 1) : 0;

  const handleSave = async () => {
    const trimmedMemo = memo.trim();
    const input: InstallmentInput = {
      name: name.trim(),
      totalAmount: totalNumber,
      installmentMonths: monthsNumber,
      startMonth,
      ...(trimmedMemo !== "" && { memo: trimmedMemo }),
    };
    try {
      setIsSaving(true);
      const result = installment
        ? await updateInstallmentAction(installment.uuid, input)
        : await createInstallmentAction(input);
      if (result.success) {
        toast.success(installment ? "할부를 수정했어요" : "할부를 추가했어요");
        onOpenChange(false);
      } else {
        toast.error(result.error.message);
        router.refresh();
      }
    } catch {
      toast.error("할부 저장에 실패했습니다");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (event: MouseEvent) => {
    // 기본 동작은 확인 즉시 닫으므로, 삭제가 끝날 때까지 열어 둔다
    event.preventDefault();
    if (!installment) return;
    try {
      setIsSaving(true);
      const result = await deleteInstallmentAction(installment.uuid);
      if (result.success) {
        toast.success("할부를 삭제했어요");
      } else {
        toast.error(result.error.message);
        router.refresh();
      }
    } catch {
      toast.error("할부 삭제에 실패했습니다");
      router.refresh();
    } finally {
      setIsSaving(false);
      setConfirmingDelete(false);
      onOpenChange(false);
    }
  };

  const body = (
    <div className="space-y-4 pt-2">
      <div>
        <label
          htmlFor="installment-name"
          className="mb-2 block text-sm font-medium text-fg"
        >
          이름
        </label>
        <Input
          id="installment-name"
          value={name}
          maxLength={NAME_MAX_LENGTH}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 노트북"
        />
      </div>

      <div>
        <label
          htmlFor="installment-total"
          className="mb-2 block text-sm font-medium text-fg"
        >
          총 금액 (원)
        </label>
        <Input
          id="installment-total"
          type="text"
          inputMode="numeric"
          value={total}
          onChange={(e) => setTotal(e.target.value.replace(/\D/g, ""))}
          className="font-num text-lg tabular-nums"
        />
      </div>

      <div>
        <label
          htmlFor="installment-months"
          className="mb-2 block text-sm font-medium text-fg"
        >
          할부 개월
        </label>
        <Input
          id="installment-months"
          type="text"
          inputMode="numeric"
          value={months}
          onChange={(e) => setMonths(e.target.value.replace(/\D/g, ""))}
          className="font-num tabular-nums"
        />
        {showPreview && (
          <p className="mt-1.5 text-xs text-fg-muted">
            {`월 ${formatCurrency(monthly)}`}
            {first !== monthly && ` · 첫 달 ${formatCurrency(first)}`}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="installment-start"
          className="mb-2 block text-sm font-medium text-fg"
        >
          첫 결제 월
        </label>
        <Input
          id="installment-start"
          type="month"
          value={startMonth}
          onChange={(e) => setStartMonth(e.target.value)}
        />
      </div>

      <div>
        <label
          htmlFor="installment-memo"
          className="mb-2 block text-sm font-medium text-fg"
        >
          메모 (선택)
        </label>
        <Input
          id="installment-memo"
          value={memo}
          maxLength={MEMO_MAX_LENGTH}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        <div>
          {installment && (
            <Button
              variant="outline"
              onClick={() => setConfirmingDelete(true)}
              disabled={isSaving}
              className="text-expense"
            >
              삭제
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="bg-brand-500 text-brand-fg hover:bg-brand-600"
          >
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  );

  const title = installment ? "할부 수정" : "할부 추가";

  return (
    <>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            {body}
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="bottom"
            className="h-auto max-h-[90dvh] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            {body}
          </SheetContent>
        </Sheet>
      )}

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>할부를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제한 할부는 되돌릴 수 없어요
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSaving}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
