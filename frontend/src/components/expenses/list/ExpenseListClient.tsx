"use client";

import { DateGroupSection } from "@/components/transactions/DateGroupSection";
import { groupTransactionsWithTotal } from "@/services/transaction/transaction-service";
import type { CategoryResponse } from "@/types/category";
import type { Expense } from "@/types/expense";
import { useState } from "react";
import { DeleteExpenseDialog } from "../dialogs/DeleteExpenseDialog";
import { EditTransactionDialog } from "@/components/transactions/dialogs/EditTransactionDialog";
import { ExpenseItem } from "./ExpenseItem";
import type { ExpenseItemData } from "@/types/expense";

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

  const categoryMap = new Map(initialCategories.map((cat) => [cat.uuid, cat]));
  const groups = groupTransactionsWithTotal(expenses);

  return (
    <>
      <div className="space-y-5">
        {groups.map((group) => (
          <DateGroupSection
            key={group.dateKey}
            group={group}
            renderItem={(expense) => {
              const cat = categoryMap.get(expense.categoryUuid);
              const expenseData: ExpenseItemData = {
                uuid: expense.uuid,
                amount: expense.amount,
                description: expense.description,
                date: expense.date,
                categoryUuid: expense.categoryUuid,
                categoryName: cat?.name || expense.category?.name || "기타",
                categoryColor: cat?.color || expense.category?.color,
                categoryIcon: cat?.icon || expense.category?.icon || "💸",
              };
              return (
                <ExpenseItem
                  key={expense.uuid}
                  expense={expenseData}
                  onEdit={() => setEditingExpense(expense)}
                  onDelete={() => setDeletingExpense(expense)}
                />
              );
            }}
          />
        ))}
      </div>

      {editingExpense && (
        <EditTransactionDialog
          key={editingExpense.uuid}
          open={!!editingExpense}
          onOpenChange={(open) => {
            if (!open) setEditingExpense(null);
          }}
          type="expense"
          transaction={editingExpense}
          familyUuid={familyUuid}
        />
      )}

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
