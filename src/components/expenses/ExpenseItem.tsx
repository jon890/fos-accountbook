"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCategoryIcon } from "@/lib/utils/category-icons";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

export interface ExpenseItemData {
  uuid: string;
  amount: string | number;
  description?: string | null;
  date: Date | string;
  category: {
    uuid: string;
    name: string;
    color: string;
    icon: string;
  };
}

interface ExpenseItemProps {
  expense: ExpenseItemData;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ExpenseItem({ expense, onEdit, onDelete }: ExpenseItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { uuid, amount, description, date, category } = expense;
  const IconComponent = getCategoryIcon(category.icon);
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Lucide 아이콘으로 매핑이 없으면 이모지를 그대로 사용
  const useEmoji = !IconComponent;

  // 모바일에서 아이템 클릭 핸들러
  const handleMobileClick = () => {
    // 버튼이 있을 때만 토글
    if (onEdit || onDelete) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      key={uuid}
      className={`p-2.5 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-r ${
        isExpanded
          ? "from-blue-50 to-white border-blue-200"
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
          <div
            className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center shadow-sm shrink-0"
            style={{
              backgroundColor: `${category.color}20`,
            }}
          >
            {useEmoji ? (
              <span className="text-lg md:text-2xl">{category.icon}</span>
            ) : (
              <div style={{ color: category.color }}>
                {IconComponent && (
                  <IconComponent className="w-4 h-4 md:w-6 md:h-6" />
                )}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1 md:space-x-2 mb-0.5">
              <h4 className="font-semibold text-gray-900 text-xs md:text-base truncate">
                {description || category.name}
              </h4>
              <Badge
                variant="secondary"
                className="text-[9px] md:text-xs px-1 md:px-1.5 py-0 shrink-0"
                style={{
                  backgroundColor: `${category.color}15`,
                  color: category.color,
                  border: "none",
                }}
              >
                {category.name}
              </Badge>
            </div>
            <p className="text-[10px] md:text-sm text-gray-500">
              {format(dateObj, "M월 d일 (E) HH:mm", {
                locale: ko,
              })}
            </p>
          </div>
        </div>

        {/* 금액 & 데스크톱 버튼 */}
        <div className="flex items-center gap-1.5 md:gap-2 ml-2 shrink-0">
          <div className="text-right">
            <p className="text-xs md:text-lg font-bold text-gray-900 whitespace-nowrap">
              -₩{Number(amount).toLocaleString()}
            </p>
          </div>
          {/* 데스크톱: hover 시 우측에 표시 */}
          <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-8 w-8"
                title="수정"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                title="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 모바일: 클릭 시 아래에 버튼 표시 */}
      {(onEdit || onDelete) && (
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-20 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
          }`}
        >
          <div
            className={`flex items-center gap-1.5 pt-2 border-t ${
              isExpanded ? "border-blue-200" : "border-gray-100"
            } transition-colors duration-300`}
          >
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="flex-1 h-7 text-xs gap-1 transform transition-transform duration-300 hover:scale-105"
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
                className="flex-1 h-7 text-xs gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 transform transition-transform duration-300 hover:scale-105"
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
