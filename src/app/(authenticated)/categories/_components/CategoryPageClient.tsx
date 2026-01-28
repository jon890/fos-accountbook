"use client";

import { Button } from "@/components/ui/button";
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

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <p className="text-sm text-gray-600">
          총{" "}
          <span className="font-semibold text-gray-900">
            {categories.length}
          </span>
          개의 카테고리
        </p>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          카테고리 추가
        </Button>
      </div>

      <CategoryList
        categories={categories}
        onEdit={handleEditClick}
        onDelete={handleCategoryDeleted}
      />

      <AddCategoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        familyUuid={familyUuid}
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
