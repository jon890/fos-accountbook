"use client";

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
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/client/utils";
import { deleteRecurringExpenseAction } from "@/actions/recurring-expense";
import type { RecurringExpense } from "@/types/recurring-expense";
import { CheckCircle, Circle, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EditTransactionDialog } from "@/components/transactions/dialogs/EditTransactionDialog";

interface RecurringExpenseItemProps {
  recurringExpense: RecurringExpense;
}

export function RecurringExpenseItem({
  recurringExpense,
}: RecurringExpenseItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { name, amount, dayOfMonth, generatedThisMonth } = recurringExpense;
  const category = recurringExpense.category ?? {
    uuid: "",
    familyUuid: "",
    name: "미분류",
    icon: "📁",
    createdAt: "",
    updatedAt: "",
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteRecurringExpenseAction(recurringExpense.uuid);

      if (result.success) {
        toast.success("고정지출이 종료되었습니다");
        setIsDeleteOpen(false);
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("고정지출 삭제 중 오류가 발생했습니다");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="group">
        {/* 메인 행 */}
        <div
          className={`flex items-center justify-between p-3 md:p-4 rounded-xl transition-colors duration-150 cursor-pointer ${
            isExpanded ? "bg-expense/5" : "bg-card hover:bg-accent"
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* 왼쪽: 상태 아이콘 + 정보 */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0">
              {generatedThisMonth ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm md:text-base truncate">
                {name}
              </p>
              <p className="text-[11px] md:text-xs text-gray-400 mt-0.5">
                {category.icon} {category.name} · 매월 {dayOfMonth}일
              </p>
            </div>
          </div>

          {/* 오른쪽: 금액 + 데스크톱 액션 */}
          <div className="flex items-center gap-1 ml-3 shrink-0">
            <p className="text-sm md:text-base font-bold text-expense whitespace-nowrap">
              ₩{Number(amount).toLocaleString()}
            </p>

            {/* 데스크톱: 호버 시 표시 */}
            <div className="hidden md:flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditOpen(true);
                }}
                className="h-7 w-7 text-gray-400 hover:text-gray-700"
                title="수정"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteOpen(true);
                }}
                className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                title="삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* 모바일: 탭 시 액션 버튼 표시 */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-200 ease-in-out ${
            isExpanded ? "max-h-16 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex gap-2 px-3 pb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditOpen(true);
              }}
              className="flex-1 h-8 text-xs gap-1.5"
            >
              <Pencil className="h-3 w-3" />
              수정
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleteOpen(true);
              }}
              className="flex-1 h-8 text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
              삭제
            </Button>
          </div>
        </div>
      </div>

      {/* 수정 다이얼로그 */}
      <EditTransactionDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        type="recurring"
        transaction={recurringExpense}
      />

      {/* 삭제 확인 AlertDialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>고정지출 종료</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">&quot;{name}&quot;</span>{" "}
              고정지출을 종료하시겠어요?
              <br />
              기존 등록된 지출은 유지됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              {isDeleting ? "종료 중..." : "종료"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
