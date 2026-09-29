"use client";

import { cn } from "@/lib/client/utils";
import {
  getMonthRange,
  getLastNMonthsRange,
  getLastYearRange,
} from "@/lib/utils/date-timezone";
import { useTimeZone } from "@/lib/client/timezone-context";
import type { CategoryResponse } from "@/types/category";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExpenseFiltersProps {
  categories: CategoryResponse[];
  defaultStartDate?: string;
  defaultEndDate?: string;
}

type QuickRange = "thisMonth" | "3months" | "1year" | "custom";

export function ExpenseFilters({
  categories,
  defaultStartDate,
  defaultEndDate,
}: ExpenseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { timezone } = useTimeZone();

  const [activeRange, setActiveRange] = useState<QuickRange>("thisMonth");
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customStart, setCustomStart] = useState(
    searchParams.get("startDate") || defaultStartDate || ""
  );
  const [customEnd, setCustomEnd] = useState(
    searchParams.get("endDate") || defaultEndDate || ""
  );

  const selectedCategory = searchParams.get("categoryId") || "all";

  const navigate = (overrides: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    params.set("page", "1");
    router.push(`/transactions?${params.toString()}`);
  };

  const applyQuickRange = (range: QuickRange) => {
    setActiveRange(range);
    setShowCustomDate(false);

    let startDate = "";
    let endDate = "";

    if (range === "thisMonth") {
      const r = getMonthRange(timezone);
      startDate = r.startDate;
      endDate = r.endDate;
    } else if (range === "3months") {
      const r = getLastNMonthsRange(timezone, 3);
      startDate = r.startDate;
      endDate = r.endDate;
    } else if (range === "1year") {
      const r = getLastYearRange(timezone);
      startDate = r.startDate;
      endDate = r.endDate;
    }

    navigate({ startDate, endDate });
  };

  const applyCustomDate = () => {
    if (!customStart || !customEnd) {
      toast.error("시작일과 종료일을 모두 입력해주세요");
      return;
    }
    if (customStart > customEnd) {
      toast.error("종료일은 시작일 이후여야 합니다");
      return;
    }
    setActiveRange("custom");
    setShowCustomDate(false);
    navigate({ startDate: customStart, endDate: customEnd });
  };

  const handleCategoryChange = (value: string) => {
    navigate({ categoryId: value === "all" ? null : value });
  };

  const clearCategory = () => navigate({ categoryId: null });

  const hasActiveCategory = selectedCategory !== "all";
  const selectedCategoryObj = categories.find((c) => c.uuid === selectedCategory);

  const chipBase =
    "px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap border shrink-0";
  const chipActive = "chip-active";
  const chipInactive =
    "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50";

  return (
    <div className="space-y-2.5">
      {/* 필터 칩 바 */}
      <div
        role="group"
        aria-label="거래 내역 필터"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5"
      >
        {/* 기간 빠른 선택 */}
        <button
          onClick={() => applyQuickRange("thisMonth")}
          aria-pressed={activeRange === "thisMonth"}
          aria-label="이번달 기간 선택"
          className={cn(chipBase, activeRange === "thisMonth" ? chipActive : chipInactive)}
        >
          이번달
        </button>
        <button
          onClick={() => applyQuickRange("3months")}
          aria-pressed={activeRange === "3months"}
          aria-label="최근 3개월 기간 선택"
          className={cn(chipBase, activeRange === "3months" ? chipActive : chipInactive)}
        >
          3개월
        </button>
        <button
          onClick={() => applyQuickRange("1year")}
          aria-pressed={activeRange === "1year"}
          aria-label="최근 1년 기간 선택"
          className={cn(chipBase, activeRange === "1year" ? chipActive : chipInactive)}
        >
          1년
        </button>
        <button
          onClick={() => {
            const next = !showCustomDate;
            setShowCustomDate(next);
            if (next) setActiveRange("custom");
          }}
          aria-expanded={showCustomDate}
          aria-controls="custom-date-panel"
          aria-label="날짜 직접 설정"
          className={cn(
            chipBase,
            "flex items-center gap-1",
            showCustomDate || activeRange === "custom" ? chipActive : chipInactive
          )}
        >
          <CalendarDays className="w-3 h-3" />
          직접 설정
        </button>

        {/* 구분선 */}
        <div className="w-px h-5 bg-gray-200 shrink-0" aria-hidden="true" />

        {/* 카테고리 필터 */}
        {hasActiveCategory ? (
          <button
            onClick={clearCategory}
            aria-label={`${selectedCategoryObj?.name} 카테고리 필터 해제`}
            className={cn(
              chipBase,
              "flex items-center gap-1.5 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            )}
          >
            {selectedCategoryObj?.icon} {selectedCategoryObj?.name}
            <X className="w-3 h-3" aria-hidden="true" />
          </button>
        ) : (
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-8 text-xs rounded-full border-gray-200 bg-white px-3 min-w-[120px] gap-1 shadow-none shrink-0">
              <SelectValue placeholder="전체 카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 카테고리</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.uuid} value={cat.uuid}>
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* 날짜 직접 입력 (펼치기) */}
      {showCustomDate && (
        <div
          id="custom-date-panel"
          className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100"
        >
          <Input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            aria-label="시작일"
            className="h-8 text-xs flex-1 min-w-0"
          />
          <span className="text-gray-400 text-xs shrink-0" aria-hidden="true">~</span>
          <Input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            aria-label="종료일"
            className="h-8 text-xs flex-1 min-w-0"
          />
          <button
            onClick={applyCustomDate}
            aria-label="날짜 범위 적용"
            className="px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-semibold hover:bg-gray-700 transition-colors shrink-0"
          >
            적용
          </button>
        </div>
      )}
    </div>
  );
}
