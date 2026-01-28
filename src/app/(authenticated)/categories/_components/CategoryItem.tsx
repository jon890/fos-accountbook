"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CategoryResponse } from "@/types/category";
import { Edit2, EyeOff, Trash2 } from "lucide-react";

interface CategoryItemProps {
  category: CategoryResponse;
  onEdit: (category: CategoryResponse) => void;
  onDelete: (category: CategoryResponse) => void;
}

export function CategoryItem({
  category,
  onEdit,
  onDelete,
}: CategoryItemProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="px-2 md:p-4">
        <div className="flex flex-col justify-between h-full gap-2 md:gap-3">
          <div className="flex items-start justify-between">
            <div
              className="w-10 h-8 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-xl md:text-2xl shrink-0"
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
                onClick={() => onDelete(category)}
              >
                <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
              </Button>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate">
                {category.name}
              </h3>

              <div
                className="w-2.5 h-2.5 rounded-full shrink-0 md:hidden"
                style={{ backgroundColor: category.color }}
              />

              {category.excludeFromBudget && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-5 gap-1 text-gray-500 w-fit whitespace-nowrap shrink-0"
                >
                  <EyeOff className="w-3 h-3" />
                  <span className="hidden md:inline">예산 제외</span>
                </Badge>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2 mt-1">
              <div
                className="w-3 h-3 md:w-4 md:h-4 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-xs text-gray-500">{category.color}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
