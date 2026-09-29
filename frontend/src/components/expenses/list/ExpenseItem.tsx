"use client";

import { Button } from "@/components/ui/button";
import { formatExpenseDate } from "@/lib/utils/format";
import { useTimeZone } from "@/lib/client/timezone-context";
import type { ExpenseItemData } from "@/types/expense";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

interface ExpenseItemProps {
  expense: ExpenseItemData;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ExpenseItem({ expense, onEdit, onDelete }: ExpenseItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { timezone } = useTimeZone();
  const { uuid, amount, description, date, categoryName, categoryColor, categoryIcon } =
    expense;

  const handleMobileClick = () => {
    if (onEdit || onDelete) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div key={uuid} className="group">
      {/* 메인 행 */}
      <div
        className={`flex items-center justify-between p-3 md:p-4 rounded-xl transition-colors duration-150 md:cursor-default cursor-pointer ${
          isExpanded ? "bg-expense/5" : "bg-white hover:bg-gray-50/80"
        }`}
        onClick={(e) => {
          if (window.innerWidth < 768) {
            e.stopPropagation();
            handleMobileClick();
          }
        }}
      >
        {/* 왼쪽: 아이콘 + 정보 */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 text-base md:text-lg"
            style={categoryColor ? { backgroundColor: `${categoryColor}18` } : undefined}
          >
            {categoryIcon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm md:text-base truncate">
              {description || categoryName}
            </p>
            <p className="text-[11px] md:text-xs text-gray-400 mt-0.5">
              {description ? `${categoryName} · ` : ""}
              {formatExpenseDate(date, timezone)}
            </p>
          </div>
        </div>

        {/* 오른쪽: 금액 + 데스크톱 액션 */}
        <div className="flex items-center gap-1 ml-3 shrink-0">
          <p className="text-sm md:text-base font-bold text-expense whitespace-nowrap">
            -₩{Number(amount).toLocaleString()}
          </p>

          {/* 데스크톱: 호버 시 표시 */}
          <div className="hidden md:flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-7 w-7 text-gray-400 hover:text-gray-700"
                title="수정"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                title="삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 모바일: 탭 시 액션 버튼 표시 */}
      {(onEdit || onDelete) && (
        <div
          className={`md:hidden overflow-hidden transition-all duration-200 ease-in-out ${
            isExpanded ? "max-h-16 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex gap-2 px-3 pb-3">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="flex-1 h-8 text-xs gap-1.5"
              >
                <Pencil className="h-3 w-3" />
                수정
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="flex-1 h-8 text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
                삭제
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
