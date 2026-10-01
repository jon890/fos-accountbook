"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/client/utils";
import type { CategoryExpenseSummaryResponse } from "@/types/expense";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type CSSProperties } from "react";

interface CategoryExpenseSummaryProps {
  summary: CategoryExpenseSummaryResponse;
}

const INITIAL_CATEGORY_COUNT = 5;

export function CategoryExpenseSummary({
  summary,
}: CategoryExpenseSummaryProps) {
  const { totalExpense, categoryStats } = summary;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAll, setShowAll] = useState(false);

  if (categoryStats.length === 0) {
    return null;
  }

  const sortedCategoryStats = [...categoryStats].sort(
    (left, right) => right.totalAmount - left.totalAmount,
  );
  const selectedCategoryId = searchParams.get("categoryId");
  // 걸러 보는 카테고리가 상위 5개 밖이면 처음부터 전체를 보여 선택 상태가 가려지지 않게 한다.
  const selectedIsHidden =
    selectedCategoryId !== null &&
    sortedCategoryStats
      .slice(INITIAL_CATEGORY_COUNT)
      .some((stat) => stat.categoryUuid === selectedCategoryId);
  const visibleCategoryStats =
    showAll || selectedIsHidden
      ? sortedCategoryStats
      : sortedCategoryStats.slice(0, INITIAL_CATEGORY_COUNT);
  const hasHiddenCategories =
    sortedCategoryStats.length > INITIAL_CATEGORY_COUNT;

  const handleCategoryClick = (categoryUuid: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("categoryId", categoryUuid);
    params.set("page", "1");
    router.push(`/transactions?${params.toString()}`);
  };

  return (
    <Card className="overflow-hidden border-border bg-bg-elev shadow-default">
      <Accordion
        type="single"
        collapsible
        defaultValue={selectedCategoryId ? "category-summary" : undefined}
      >
        <AccordionItem value="category-summary" className="border-0">
          <AccordionTrigger className="px-4 py-3.5 hover:no-underline md:px-6">
            <div className="w-full pr-2 text-left">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-base font-bold text-fg md:text-lg">
                  카테고리별 지출
                </h3>
                <p className="num shrink-0 text-sm font-semibold text-fg md:text-base">
                  총 ₩{totalExpense.toLocaleString()}
                </p>
              </div>
              <div
                aria-hidden="true"
                className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-bg-muted"
              >
                {sortedCategoryStats.map((stat) => (
                  <span
                    key={stat.categoryUuid}
                    className="h-full"
                    style={{
                      width: `${stat.percentage}%`,
                      backgroundColor: stat.categoryColor,
                    }}
                  />
                ))}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="px-4 pb-4 pt-0 md:px-6 md:pb-5">
              <div className="divide-y divide-border border-y border-border">
                {visibleCategoryStats.map((stat) => {
                  const isSelected =
                    searchParams.get("categoryId") === stat.categoryUuid;
                  const categoryColorStyle = {
                    "--cat-color": stat.categoryColor,
                  } as CSSProperties;

                  return (
                    <Button
                      key={stat.categoryUuid}
                      type="button"
                      variant="ghost"
                      aria-pressed={isSelected}
                      onClick={() => handleCategoryClick(stat.categoryUuid)}
                      className={cn(
                        "h-auto w-full justify-start gap-3 rounded-none p-0 py-2.5 text-left hover:bg-transparent",
                        isSelected && "bg-brand-50 hover:bg-brand-50",
                      )}
                      style={categoryColorStyle}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--cat-color)_12%,transparent)] text-base">
                        {stat.categoryIcon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold leading-[19px] text-fg">
                            {stat.categoryName}
                          </span>
                          <span className="shrink-0 text-xs leading-[15px] text-fg-muted">
                            {stat.count}건
                          </span>
                        </span>
                        <span className="mt-1 block h-1 overflow-hidden rounded-full bg-bg-muted">
                          <span
                            className="block h-full rounded-full bg-[var(--cat-color)]"
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="num block text-sm font-semibold leading-[19px] text-fg">
                          ₩{stat.totalAmount.toLocaleString()}
                        </span>
                        <span className="num block text-xs leading-[15px] text-fg-muted">
                          {stat.percentage.toFixed(1)}%
                        </span>
                      </span>
                    </Button>
                  );
                })}
              </div>
              {hasHiddenCategories && !showAll && (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-3 h-auto w-full p-0 text-brand-700 hover:bg-transparent hover:text-brand-800"
                  onClick={() => setShowAll(true)}
                >
                  전체 {sortedCategoryStats.length}개 보기
                </Button>
              )}
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
