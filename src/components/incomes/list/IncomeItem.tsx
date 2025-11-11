"use client";

import type { Income } from "@/types/income";
import { formatExpenseDate } from "@/lib/utils/format";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { EditIncomeDialog } from "../dialogs/EditIncomeDialog";
import type { CategoryResponse } from "@/types/category";
import { deleteIncomeAction } from "@/app/actions/income/delete-income-action";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
    } finally {
      setIsDeleting(false);
    }
  };

  // 모바일에서 아이템 클릭 핸들러
  const handleMobileClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`p-2.5 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-r ${
        isExpanded
          ? "from-emerald-50 to-white border-emerald-200"
          : "from-gray-50 to-white border-gray-100"
      } hover:shadow-md transition-all duration-300 group`}
    >
      {/* 메인 컨텐츠 */}
      <div
        className="flex items-center justify-between md:cursor-default cursor-pointer"
        onClick={(e) => {
          // 모바일에서만 클릭 이벤트 처리
          if (window.innerWidth < 768) {
            e.stopPropagation();
            handleMobileClick();
          }
        }}
      >
        <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
          {/* 카테고리 아이콘 */}
          <div className="w-9 h-9 md:w-12 md:h-12 bg-emerald-100 rounded-lg md:rounded-2xl flex items-center justify-center text-base md:text-xl shadow-sm shrink-0">
            {income.category.icon}
          </div>

          {/* 카테고리명 + 설명 */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-xs md:text-base truncate">
              {income.category.name}
            </p>
            <div className="flex items-center gap-1 text-[10px] md:text-sm text-gray-500 mt-0.5">
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

        {/* 금액 & 데스크톱 버튼 */}
        <div className="flex items-center gap-1.5 md:gap-2 ml-2 shrink-0">
          <div className="text-right">
            <p className="text-xs md:text-lg font-bold text-emerald-600 whitespace-nowrap">
              +₩{income.amount.toLocaleString()}
            </p>
          </div>

          {/* 데스크탑: 호버 시 우측에 표시 */}
          <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditDialogOpen(true);
              }}
              className="h-8 w-8"
              title="수정"
              disabled={isDeleting}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
              title="삭제"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 모바일: 클릭 시 아래에 버튼 표시 */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-20 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
        }`}
      >
        <div
          className={`flex items-center gap-1.5 pt-2 border-t ${
            isExpanded ? "border-emerald-200" : "border-gray-100"
          } transition-colors duration-300`}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditDialogOpen(true);
            }}
            className="flex-1 h-7 text-xs gap-1 transform transition-transform duration-300 hover:scale-105"
            disabled={isDeleting}
          >
            <Edit className="h-3 w-3" />
            수정
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="flex-1 h-7 text-xs gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 transform transition-transform duration-300 hover:scale-105"
            disabled={isDeleting}
          >
            <Trash2 className="h-3 w-3" />
            삭제
          </Button>
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
