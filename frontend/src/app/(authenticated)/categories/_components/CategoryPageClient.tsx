"use client";

import { Button } from "@/components/ui/button";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import type { CategoryResponse } from "@/types/category";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { CategoryList } from "./CategoryList";
import { EditCategoryDialog } from "./EditCategoryDialog";

interface CategoryPageClientProps {
  initialCategories: CategoryResponse[];
  familyUuid: string;
  hasInitialError?: boolean;
}

export function CategoryPageClient({
  initialCategories,
  familyUuid,
  hasInitialError = false,
}: CategoryPageClientProps) {
  useEffect(() => {
    if (hasInitialError) {
      toast.error(
        "카테고리 목록을 불러오는데 실패했습니다. 다시 시도해주세요.",
      );
    }
  }, [hasInitialError]);
  const [categories, setCategories] = useState(initialCategories);
  const [categoryType, setCategoryType] = useState<"EXPENSE" | "INCOME">(
    "EXPENSE",
  );
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryResponse | null>(null);

  const handleCategoryAdded = (newCategory: CategoryResponse) => {
    setCategories([...categories, newCategory]);
  };

  const handleCategoryUpdated = (updatedCategory: CategoryResponse) => {
    setCategories(
      categories.map((cat) =>
        cat.uuid === updatedCategory.uuid ? updatedCategory : cat,
      ),
    );
  };

  const handleCategoryDeleted = (categoryUuid: string) => {
    setCategories(categories.filter((cat) => cat.uuid !== categoryUuid));
  };

  const handleEditClick = (category: CategoryResponse) => {
    setSelectedCategory(category);
    setEditDialogOpen(true);
  };

  const displayedCategories = categories.filter(
    (category) => category.type === categoryType,
  );

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <SegmentedToggle
          options={[
            { key: "EXPENSE", label: "지출" },
            { key: "INCOME", label: "수입" },
          ]}
          value={categoryType}
          onChange={setCategoryType}
          ariaLabel="카테고리 종류 선택"
        />
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          카테고리 추가
        </Button>
      </div>

      <CategoryList
        categories={displayedCategories}
        onEdit={handleEditClick}
        onDelete={handleCategoryDeleted}
      />

      <AddCategoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        familyUuid={familyUuid}
        type={categoryType}
        onSuccess={handleCategoryAdded}
      />

      {selectedCategory && (
        <EditCategoryDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          category={selectedCategory}
          onSuccess={handleCategoryUpdated}
        />
      )}
    </>
  );
}
