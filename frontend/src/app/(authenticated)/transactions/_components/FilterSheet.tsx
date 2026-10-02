"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ALL_CATEGORIES,
  buildFilterUrl,
  countActiveFilters,
  readFilterDraft,
  resetFilterDraft,
  resolveQuickRange,
  validateFilterDraft,
  type FilterDraft,
  type QuickRange,
} from "@/app/(authenticated)/transactions/_components/filter-state";
import { useAppRouter, useNavigationPending } from "@/lib/client/navigation";
import { useTimeZone } from "@/lib/client/timezone-context";
import { cn } from "@/lib/client/utils";
import type { CategoryResponse } from "@/types/category";

interface FilterSheetProps {
  categories: CategoryResponse[];
  categoryType: CategoryResponse["type"];
  defaultStartDate?: string;
  defaultEndDate?: string;
}

const RANGE_OPTIONS: { value: QuickRange; label: string }[] = [
  { value: "thisMonth", label: "이번달" },
  { value: "3months", label: "3개월" },
  { value: "1year", label: "1년" },
  { value: "custom", label: "직접 입력" },
];

const optionBase =
  "border px-3 py-1.5 text-xs font-medium transition-colors rounded-full whitespace-nowrap";
const optionDefault = "border-border bg-bg-elev text-fg-muted hover:text-fg";
const optionActive = "border-brand-300 bg-brand-50 text-brand-700";

export function FilterSheet({
  categories,
  categoryType,
  defaultStartDate,
  defaultEndDate,
}: FilterSheetProps) {
  const router = useAppRouter();
  const isNavigationPending = useNavigationPending();
  const searchParams = useSearchParams();
  const { timezone } = useTimeZone();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 시트 안에서 바꾼 값(draft)은 적용 전까지 주소에 반영하지 않는다.
  // 주소가 바뀌면 draft 를 버리고 현재 값을 쓴다 (ADR-F17: draft ?? current).
  const query = searchParams.toString();
  const current = readFilterDraft(searchParams, timezone, {
    startDate: defaultStartDate,
    endDate: defaultEndDate,
  });
  const [draftState, setDraftState] = useState<{
    query: string;
    value: FilterDraft;
  } | null>(null);
  const draft = draftState?.query === query ? draftState.value : current;
  const activeCount = countActiveFilters(current);
  const typedCategories = categories.filter((c) => c.type === categoryType);

  const updateDraft = (value: FilterDraft) => {
    setDraftState({ query, value });
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    setDraftState(null);
    setError(null);
  };

  const selectRange = (range: QuickRange) => {
    if (range === "custom") {
      updateDraft({ ...draft, range });
      return;
    }
    updateDraft({ ...draft, range, ...resolveQuickRange(range, timezone) });
  };

  const apply = () => {
    if (isNavigationPending) {
      return;
    }

    const validationError = validateFilterDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    router.replace(buildFilterUrl(query, draft));
    handleOpenChange(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        disabled={isNavigationPending}
        aria-haspopup="dialog"
        aria-label={activeCount > 0 ? `필터, ${activeCount}개 적용 중` : "필터"}
        className={cn(
          "flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium rounded-full",
          activeCount > 0 ? optionActive : optionDefault
        )}
      >
        <SlidersHorizontal size={13} aria-hidden="true" />
        필터
        {activeCount > 0 && (
          <span
            data-testid="filter-badge"
            className="min-w-4 rounded-full bg-brand-500 px-1 text-center text-[10px] leading-4 text-brand-fg"
          >
            {activeCount}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>필터</SheetTitle>
            <SheetDescription className="sr-only">
              기간, 카테고리, 금액 범위를 고르고 적용합니다.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4">
            <section className="space-y-2" aria-label="기간">
              <p className="text-sm font-semibold text-fg">기간</p>
              <div className="flex flex-wrap gap-2">
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={draft.range === option.value}
                    onClick={() => selectRange(option.value)}
                    className={cn(
                      optionBase,
                      draft.range === option.value ? optionActive : optionDefault
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {draft.range === "custom" && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={draft.startDate}
                    onChange={(e) => updateDraft({ ...draft, startDate: e.target.value })}
                    aria-label="시작일"
                    className="h-9 text-sm flex-1 min-w-0"
                  />
                  <span className="text-fg-muted text-xs shrink-0" aria-hidden="true">
                    -
                  </span>
                  <Input
                    type="date"
                    value={draft.endDate}
                    onChange={(e) => updateDraft({ ...draft, endDate: e.target.value })}
                    aria-label="종료일"
                    className="h-9 text-sm flex-1 min-w-0"
                  />
                </div>
              )}
            </section>

            <section className="space-y-2" aria-label="카테고리">
              <p className="text-sm font-semibold text-fg">카테고리</p>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                <button
                  type="button"
                  aria-pressed={draft.categoryId === ALL_CATEGORIES}
                  onClick={() => updateDraft({ ...draft, categoryId: ALL_CATEGORIES })}
                  className={cn(
                    optionBase,
                    draft.categoryId === ALL_CATEGORIES ? optionActive : optionDefault
                  )}
                >
                  전체 카테고리
                </button>
                {typedCategories.map((category) => (
                  <button
                    key={category.uuid}
                    type="button"
                    aria-pressed={draft.categoryId === category.uuid}
                    onClick={() => updateDraft({ ...draft, categoryId: category.uuid })}
                    className={cn(
                      optionBase,
                      draft.categoryId === category.uuid ? optionActive : optionDefault
                    )}
                  >
                    {category.icon} {category.name}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2" aria-label="금액 범위">
              <p className="text-sm font-semibold text-fg">금액 범위</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="최솟값"
                  value={draft.amountMin}
                  onChange={(e) => updateDraft({ ...draft, amountMin: e.target.value })}
                  aria-label="최솟값 금액"
                  className="h-9 text-sm flex-1 min-w-0"
                />
                <span className="text-fg-muted text-xs shrink-0" aria-hidden="true">
                  ~
                </span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="최댓값"
                  value={draft.amountMax}
                  onChange={(e) => updateDraft({ ...draft, amountMax: e.target.value })}
                  aria-label="최댓값 금액"
                  className="h-9 text-sm flex-1 min-w-0"
                />
              </div>
            </section>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <SheetFooter className="flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => updateDraft(resetFilterDraft(timezone))}
            >
              초기화
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={apply}
              disabled={isNavigationPending}
            >
              적용
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
