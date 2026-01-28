"use client";

import { deleteCategoryAction } from "@/app/actions/category/delete-category-action";
import { Card, CardContent } from "@/components/ui/card";
import type { CategoryResponse } from "@/types/category";
import { useState } from "react";
import { toast } from "sonner";
import { CategoryItem } from "./CategoryItem";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";

interface CategoryListProps {
  categories: CategoryResponse[];
  onEdit: (category: CategoryResponse) => void;
  onDelete: (categoryUuid: string) => void;
}

export function CategoryList({
  categories,
  onEdit,
  onDelete,
}: CategoryListProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<CategoryResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (category: CategoryResponse) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteCategoryAction(categoryToDelete.uuid);

      if (result.success) {
        toast.success("카테고리가 삭제되었습니다");
        onDelete(categoryToDelete.uuid);
        setDeleteConfirmOpen(false);
        setCategoryToDelete(null);
      } else {
        toast.error(result.error.message);
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error("카테고리 삭제 중 오류가 발생했습니다");
    } finally {
      setIsDeleting(false);
    }
  };

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">등록된 카테고리가 없습니다</p>
            <p className="text-sm">카테고리를 추가해주세요</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
        {categories.map((category) => (
          <CategoryItem
            key={category.uuid}
            category={category}
            onEdit={onEdit}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      <DeleteCategoryDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        categoryName={categoryToDelete?.name}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}
