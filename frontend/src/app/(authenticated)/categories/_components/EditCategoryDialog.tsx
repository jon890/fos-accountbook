"use client";

import { updateCategoryAction } from "@/actions/category/update-category-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CategoryResponse } from "@/types/category";
import { useState } from "react";
import { toast } from "sonner";
import { PALETTE, commonEmojis } from "./category-constants";

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryResponse;
  onSuccess: (category: CategoryResponse) => void;
}

export function EditCategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: EditCategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>카테고리 수정</DialogTitle>
          <DialogDescription>카테고리 정보를 수정합니다</DialogDescription>
        </DialogHeader>
        {open ? (
          <EditCategoryDialogBody
            key={category.uuid}
            category={category}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface EditCategoryDialogBodyProps {
  category: CategoryResponse;
  onOpenChange: (open: boolean) => void;
  onSuccess: (category: CategoryResponse) => void;
}

function EditCategoryDialogBody({
  category,
  onOpenChange,
  onSuccess,
}: EditCategoryDialogBodyProps) {
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);
  const [icon, setIcon] = useState(category.icon || "📦");
  const [excludeFromBudget, setExcludeFromBudget] = useState(
    category.excludeFromBudget || false,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("카테고리 이름을 입력해주세요");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateCategoryAction(category.uuid, {
        name: name.trim(),
        color,
        icon,
        excludeFromBudget,
      });

      if (result.success) {
        toast.success("카테고리가 수정되었습니다");
        onSuccess(result.data);
        onOpenChange(false);
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("카테고리 수정 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">카테고리 이름 *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 식비, 교통비"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>아이콘</Label>
        <div className="flex items-center gap-2 mb-2">
          <div className="text-3xl">{icon}</div>
          <Input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="flex-1"
            placeholder="이모지 입력"
          />
        </div>
        <div className="grid grid-cols-10 gap-1 p-2 border rounded-md max-h-32 overflow-y-auto">
          {commonEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className={`text-2xl p-1 rounded hover:bg-bg-muted ${
                icon === emoji ? "bg-bg-muted" : ""
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>색상</Label>
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-10 h-10 rounded border border-border shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs text-fg-muted flex-1 truncate">{color}</span>
        </div>
        <div className="flex flex-wrap gap-2 p-2 border border-border rounded-md">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                color === c ? "border-fg scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="excludeFromBudget-edit"
          checked={excludeFromBudget}
          onChange={(e) => setExcludeFromBudget(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        <Label htmlFor="excludeFromBudget-edit" className="cursor-pointer">
          예산 합계에서 제외
        </Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "수정 중..." : "수정"}
        </Button>
      </div>
    </form>
  );
}
