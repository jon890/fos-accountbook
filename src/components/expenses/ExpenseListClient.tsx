/**
 * 지출 목록 클라이언트 컴포넌트
 * 수정 다이얼로그 상태 관리
 */

"use client";

import { getFamilyCategoriesAction } from "@/app/actions/category/get-categories-action";
import type { ExpenseItemData } from "@/types/actions";
import type { CategoryResponse } from "@/types/category";
import type { Expense } from "@/types/expense";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DeleteExpenseDialog } from "./DeleteExpenseDialog";
import { EditExpenseDialog } from "./EditExpenseDialog";
import { ExpenseItem } from "./ExpenseItem";

interface ExpenseListClientProps {
  expenses: Expense[];
  categories: CategoryResponse[];
  familyUuid: string;
}

export function ExpenseListClient({
  expenses,
  categories: initialCategories,
  familyUuid,
}: ExpenseListClientProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
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
          const expenseData: ExpenseItemData = {
            uuid: expense.uuid,
            amount: expense.amount,
            description: expense.description,
            date: expense.date,
            categoryUuid: expense.categoryUuid,
            categoryName: category?.name || expense.category?.name || "기타",
            categoryColor:
              category?.color || expense.category?.color || "#6366f1",
            categoryIcon: category?.icon || expense.category?.icon || "default",
          };
          return (
            <ExpenseItem
              key={expense.uuid}
              expense={expenseData}
              onEdit={() => setEditingExpense(expense)}
              onDelete={() => setDeletingExpense(expense)}
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
            amount: String(editingExpense.amount),
            description: editingExpense.description || undefined,
            date: editingExpense.date,
            categoryUuid: editingExpense.categoryUuid,
          }}
          familyUuid={familyUuid}
          categories={categories}
          isLoadingCategories={isLoadingCategories}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      {deletingExpense && (
        <DeleteExpenseDialog
          open={!!deletingExpense}
          onOpenChange={(open) => {
            if (!open) setDeletingExpense(null);
          }}
          familyUuid={familyUuid}
          expenseUuid={deletingExpense.uuid}
          expenseDescription={deletingExpense.description || undefined}
          onDeleted={() => {
            setDeletingExpense(null);
          }}
        />
      )}
    </>
  );
}
