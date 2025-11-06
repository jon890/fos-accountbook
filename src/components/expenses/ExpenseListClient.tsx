/**
 * 지출 목록 클라이언트 컴포넌트
 * 수정 다이얼로그 상태 관리
 */

"use client";

import { getFamilyCategoriesAction } from "@/app/actions/category/get-categories-action";
import type { CategoryResponse } from "@/types/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EditExpenseDialog } from "./EditExpenseDialog";
import { ExpenseItem } from "./ExpenseItem";

interface ExpenseData {
  uuid: string;
  amount: string;
  description?: string;
  date: string;
  categoryUuid: string;
  categoryName?: string;
  categoryColor?: string;
}

interface ExpenseListClientProps {
  expenses: ExpenseData[];
  categories: CategoryResponse[];
  familyUuid: string;
}

export function ExpenseListClient({
  expenses,
  categories: initialCategories,
  familyUuid,
}: ExpenseListClientProps) {
  const [editingExpense, setEditingExpense] = useState<ExpenseData | null>(
    null
  );
  const [categories, setCategories] =
    useState<CategoryResponse[]>(initialCategories);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // 카테고리 로드 (다이얼로그 열릴 때)
  useEffect(() => {
    if (editingExpense && categories.length === 0) {
      loadCategories();
    }
  }, [editingExpense]);

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const result = await getFamilyCategoriesAction();
      if (result.success) {
        setCategories(result.data);
      } else {
        toast.error(result.error.message);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("카테고리를 불러오는데 실패했습니다");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // 카테고리 매핑
  const categoryMap = new Map(categories.map((cat) => [cat.uuid, cat]));

  return (
    <>
      <div className="space-y-2 md:space-y-3">
        {expenses.map((expense) => {
          const category = categoryMap.get(expense.categoryUuid);
          return (
            <ExpenseItem
              key={expense.uuid}
              uuid={expense.uuid}
              amount={expense.amount}
              description={expense.description}
              date={expense.date}
              category={{
                uuid: expense.categoryUuid,
                name: category?.name || expense.categoryName || "기타",
                color: category?.color || expense.categoryColor || "#6366f1",
                icon: category?.icon || "default",
              }}
              onEdit={() => setEditingExpense(expense)}
            />
          );
        })}
      </div>

      {/* 수정 다이얼로그 */}
      {editingExpense && (
        <EditExpenseDialog
          open={!!editingExpense}
          onOpenChange={(open) => {
            if (!open) setEditingExpense(null);
          }}
          expense={{
            uuid: editingExpense.uuid,
            amount: editingExpense.amount,
            description: editingExpense.description,
            date: editingExpense.date,
            categoryUuid: editingExpense.categoryUuid,
          }}
          familyUuid={familyUuid}
          categories={categories}
          isLoadingCategories={isLoadingCategories}
        />
      )}
    </>
  );
}
