"use client";

import type { Income } from "@/types/income";
import { formatExpenseDate } from "@/lib/utils/format";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { EditIncomeDialog } from "./EditIncomeDialog";
import type { CategoryResponse } from "@/types/api";
import { deleteIncomeAction } from "@/app/actions/income/delete-income-action";
import { toast } from "sonner";

interface IncomeItemProps {
  income: Income;
  familyUuid: string;
  categories: CategoryResponse[];
}

export function IncomeItem({
  income,
  familyUuid,
  categories,
}: IncomeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("이 수입 내역을 삭제하시겠습니까?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteIncomeAction(familyUuid, income.uuid);

      if (result.success) {
        toast.success("수입이 삭제되었습니다");
      } else {
        toast.error(result.error?.message || "삭제에 실패했습니다");
      }
    } catch (error) {
      toast.error("삭제 중 오류가 발생했습니다");
    } finally {
      setIsDeleting(false);
    }
  };

  console.log(income);

  return (
    <div
      className="group flex items-center justify-between p-3 rounded-lg hover:bg-emerald-50/50 transition-colors cursor-pointer relative"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* 왼쪽: 카테고리 아이콘 + 정보 */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* 카테고리 아이콘 */}
        <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-emerald-100 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-xl shadow-sm">
          {income.category.icon}
        </div>

        {/* 카테고리명 + 설명 */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm md:text-base truncate">
            {income.category.name}
          </p>
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mt-0.5">
            <span>{formatExpenseDate(income.date)}</span>
            {income.description && (
              <>
                <span>•</span>
                <span className="truncate">{income.description}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 오른쪽: 금액 + 버튼 */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <span className="font-semibold text-emerald-600 text-sm md:text-base whitespace-nowrap">
          +₩{income.amount.toLocaleString()}
        </span>

        {/* 모바일: 클릭 시 버튼 표시 */}
        <div className="md:hidden flex items-center gap-1">
          {isExpanded && (
            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditDialogOpen(true);
                }}
                className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors"
                aria-label="수입 수정"
                disabled={isDeleting}
              >
                <Edit className="w-4 h-4 text-emerald-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="수입 삭제"
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          )}
        </div>

        {/* 데스크탑: 호버 시 버튼 표시 */}
        <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditDialogOpen(true);
            }}
            className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
            aria-label="수입 수정"
            disabled={isDeleting}
          >
            <Edit className="w-4 h-4 text-emerald-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="수입 삭제"
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* 수정 다이얼로그 */}
      <EditIncomeDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        income={income}
        familyUuid={familyUuid}
        categories={categories}
      />
    </div>
  );
}
