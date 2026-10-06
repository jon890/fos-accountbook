"use client";

import { getCategoryToneStyle } from "@/lib/utils/category-tone";
import type { CategoryResponse } from "@/types/category";
import type { Expense } from "@/types/expense";
import { useMemo } from "react";

interface AnalyticsTopExpensesProps {
  expenses: Expense[];
  categories: CategoryResponse[];
  totalElements: number;
}

function formatAmount(amount: number) {
  return amount.toLocaleString("ko-KR");
}

export function AnalyticsTopExpenses({
  expenses,
  categories,
  totalElements,
}: AnalyticsTopExpensesProps) {
  const categoriesByUuid = useMemo(
    () => new Map(categories.map((category) => [category.uuid, category])),
    [categories],
  );
  const topExpenses = useMemo(
    () => [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5),
    [expenses],
  );

  if (topExpenses.length === 0) {
    return null;
  }

  const hasMoreExpenses = totalElements > expenses.length;

  return (
    <div className="bg-bg-elev rounded-2xl p-4 shadow-sm border border-border">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-bold text-fg">지출 TOP 5</h2>
        {hasMoreExpenses && (
          <span className="text-xs text-fg-muted">최근 1000건 안에서 골랐어요</span>
        )}
      </div>
      <div className="space-y-2.5">
        {topExpenses.map((expense, index) => {
          const category = categoriesByUuid.get(expense.categoryUuid);
          const categoryName = category?.name ?? "기타";
          const categoryIcon = category?.icon ?? "💸";
          const categoryToneStyle = getCategoryToneStyle(categoryName);

          return (
            <div key={expense.uuid} className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-bg-muted text-[10px] font-bold text-fg-subtle flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                style={categoryToneStyle}
              >
                {categoryIcon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-fg truncate">
                  {expense.description || categoryName}
                </p>
                <p className="text-[10px] text-fg-subtle">
                  {expense.description ? `${categoryName} · ` : ""}
                  {expense.date.split("T")[0]}
                </p>
              </div>
              <p className="text-sm font-bold text-expense shrink-0">
                -₩{formatAmount(Number(expense.amount))}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
