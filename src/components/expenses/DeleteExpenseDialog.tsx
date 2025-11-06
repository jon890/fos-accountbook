/**
 * 지출 삭제 확인 다이얼로그
 */

"use client";

import { deleteExpenseAction } from "@/app/actions/expense/delete-expense-action";
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
import { useState } from "react";
import { toast } from "sonner";

interface DeleteExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyUuid: string;
  expenseUuid: string;
  expenseDescription?: string;
  onDeleted?: () => void;
}

export function DeleteExpenseDialog({
  open,
  onOpenChange,
  familyUuid,
  expenseUuid,
  expenseDescription,
  onDeleted,
}: DeleteExpenseDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteExpenseAction(familyUuid, expenseUuid);

      if (result.success) {
        toast.success("지출이 삭제되었습니다");
        onOpenChange(false);
        onDeleted?.();
      } else {
        toast.error(result.error?.message || "지출 삭제에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to delete expense:", error);
      toast.error("지출 삭제 중 오류가 발생했습니다");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>지출 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            {expenseDescription ? (
              <>
                <span className="font-semibold">
                  &quot;{expenseDescription}&quot;
                </span>{" "}
                지출을 정말 삭제하시겠습니까?
              </>
            ) : (
              "이 지출을 정말 삭제하시겠습니까?"
            )}
            <br />이 작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
