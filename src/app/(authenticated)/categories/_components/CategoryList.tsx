"use client";

import { deleteCategoryAction } from "@/app/actions/category/delete-category-action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CategoryResponse } from "@/types/category";
import { Edit2, Trash2, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {categories.map((category) => (
          <Card
            key={category.uuid}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col justify-between h-full gap-3">
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-xl md:text-2xl shrink-0"
                    style={{ backgroundColor: category.color + "20" }}
                  >
                    {category.icon}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 md:h-8 md:w-8"
                      onClick={() => onEdit(category)}
                    >
                      <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 md:h-8 md:w-8"
                      onClick={() => handleDeleteClick(category)}
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate w-full">
                      {category.name}
                    </h3>
                    {category.excludeFromBudget && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-5 gap-1 text-gray-500 w-fit whitespace-nowrap"
                      >
                        <EyeOff className="w-3 h-3" />
                        <span className="hidden md:inline">예산 제외</span>
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 md:mt-1">
                    <div
                      className="w-3 h-3 md:w-4 md:h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-xs text-gray-500 hidden md:inline">
                      {category.color}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>카테고리 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로{" "}
              <span className="font-semibold">{categoryToDelete?.name}</span>{" "}
              카테고리를 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
