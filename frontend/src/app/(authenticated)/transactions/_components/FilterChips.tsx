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
import { AmountRangeFilter } from "@/app/(authenticated)/transactions/_components/AmountRangeFilter";
import { ChevronDown, CalendarDays, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterChipsProps {
  categories: CategoryResponse[];
  defaultStartDate?: string;
  defaultEndDate?: string;
}

type QuickRange = "thisMonth" | "3months" | "1year" | "custom";

const chipBase =
  "flex items-center gap-1 border px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap shrink-0 rounded-full md:rounded-md";

const chipDefault = "border-border bg-bg-elev text-fg-muted hover:text-fg";
const chipActive = "border-brand-300 bg-brand-50 text-brand-700";

export function FilterChips({
  categories,
  defaultStartDate,
  defaultEndDate,
}: FilterChipsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { timezone } = useTimeZone();

  const [activeRange, setActiveRange] = useState<QuickRange>("thisMonth");
  const [showDatePanel, setShowDatePanel] = useState(false);
  const [customStart, setCustomStart] = useState(
    searchParams.get("startDate") || defaultStartDate || ""
  );
  const [customEnd, setCustomEnd] = useState(
    searchParams.get("endDate") || defaultEndDate || ""
  );

  const selectedCategory = searchParams.get("categoryId") || "all";
  const hasActiveCategory = selectedCategory !== "all";
  const selectedCategoryObj = categories.find((c) => c.uuid === selectedCategory);

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
    setShowDatePanel(false);

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
    setShowDatePanel(false);
    navigate({ startDate: customStart, endDate: customEnd });
  };

  const handleCategoryChange = (value: string) => {
    navigate({ categoryId: value === "all" ? null : value });
  };

  const clearCategory = () => navigate({ categoryId: null });

  const RANGE_LABELS: Record<QuickRange, string> = {
    thisMonth: "이번달",
    "3months": "3개월",
    "1year": "1년",
    custom: "직접 설정",
  };

  return (
    <div className="space-y-2.5">
      <div
        role="group"
        aria-label="거래 내역 필터"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5"
      >
        {/* 기간 chip */}
        <button
          onClick={() => setShowDatePanel((v) => !v)}
          aria-expanded={showDatePanel}
          aria-controls="filter-date-panel"
          aria-label="기간 필터 선택"
          className={cn(chipBase, activeRange !== "thisMonth" || showDatePanel ? chipActive : chipDefault)}
        >
          <CalendarDays size={13} aria-hidden="true" />
          {RANGE_LABELS[activeRange]}
          <ChevronDown size={13} aria-hidden="true" />
        </button>

        {/* 기간 빠른 선택 chips */}
        <button
          onClick={() => applyQuickRange("thisMonth")}
          aria-pressed={activeRange === "thisMonth"}
          aria-label="이번달"
          className={cn(chipBase, activeRange === "thisMonth" ? chipActive : chipDefault)}
        >
          이번달
        </button>
        <button
          onClick={() => applyQuickRange("3months")}
          aria-pressed={activeRange === "3months"}
          aria-label="3개월"
          className={cn(chipBase, activeRange === "3months" ? chipActive : chipDefault)}
        >
          3개월
        </button>
        <button
          onClick={() => applyQuickRange("1year")}
          aria-pressed={activeRange === "1year"}
          aria-label="1년"
          className={cn(chipBase, activeRange === "1year" ? chipActive : chipDefault)}
        >
          1년
        </button>

        {/* 구분선 */}
        <div className="w-px h-5 bg-border shrink-0" aria-hidden="true" />

        {/* 카테고리 chip */}
        {hasActiveCategory ? (
          <button
            onClick={clearCategory}
            aria-label={`${selectedCategoryObj?.name} 카테고리 필터 해제`}
            className={cn(chipBase, chipActive)}
          >
            {selectedCategoryObj?.icon} {selectedCategoryObj?.name}
            <X size={13} aria-hidden="true" />
          </button>
        ) : (
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger
              className={cn(
                "h-auto text-xs shadow-none shrink-0 min-w-[120px]",
                "border-border bg-bg-elev text-fg-muted",
                "rounded-full md:rounded-md px-3 py-1.5 gap-1"
              )}
              aria-label="카테고리 필터 선택"
            >
              <SelectValue placeholder="카테고리" />
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

        {/* 금액 범위 필터 */}
        <AmountRangeFilter />
      </div>

      {/* 날짜 직접 입력 패널 */}
      {showDatePanel && (
        <div
          id="filter-date-panel"
          className="flex items-center gap-2 p-3 bg-bg-muted rounded-xl border border-border"
        >
          <Input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            aria-label="시작일"
            className="h-8 text-xs flex-1 min-w-0"
          />
          <span className="text-fg-muted text-xs shrink-0" aria-hidden="true">-</span>
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
            className="px-3 py-1.5 rounded-lg bg-fg text-bg text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            적용
          </button>
        </div>
      )}
    </div>
  );
}
