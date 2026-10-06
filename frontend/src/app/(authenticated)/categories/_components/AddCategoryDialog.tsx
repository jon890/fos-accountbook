"use client";

import { createCategoryAction } from "@/actions/category/create-category-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CategoryResponse } from "@/types/category";
import { useState } from "react";
import { toast } from "sonner";
import { PALETTE, commonEmojis } from "./category-constants";
import { CategoryFormShell } from "./CategoryFormShell";

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyUuid: string;
  type: "EXPENSE" | "INCOME";
  onSuccess: (category: CategoryResponse) => void;
}

export function AddCategoryDialog({
  open,
  onOpenChange,
  familyUuid,
  type,
  onSuccess,
}: AddCategoryDialogProps) {
  return (
    <CategoryFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="카테고리 추가"
      description={`새로운 ${type === "EXPENSE" ? "지출" : "수입"} 카테고리를 추가합니다`}
    >
      {open ? (
        <AddCategoryDialogBody
          familyUuid={familyUuid}
          type={type}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      ) : null}
    </CategoryFormShell>
  );
}

interface AddCategoryDialogBodyProps {
  familyUuid: string;
  type: "EXPENSE" | "INCOME";
  onOpenChange: (open: boolean) => void;
  onSuccess: (category: CategoryResponse) => void;
}

function AddCategoryDialogBody({
  familyUuid,
  type,
  onOpenChange,
  onSuccess,
}: AddCategoryDialogBodyProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [icon, setIcon] = useState("📦");
  const [excludeFromBudget, setExcludeFromBudget] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("카테고리 이름을 입력해주세요");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createCategoryAction(familyUuid, {
        type,
        name: name.trim(),
        color,
        icon,
        excludeFromBudget,
      });

      if (result.success) {
        toast.success("카테고리가 생성되었습니다");
        onSuccess(result.data);
        onOpenChange(false);
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("카테고리 생성 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-1 pb-4 md:px-0">
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
        <div className="grid max-h-[178px] grid-cols-8 gap-0 overflow-y-auto rounded-md border border-border p-0">
          {commonEmojis.map((emoji) => (
            <Button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              variant="ghost"
              size="icon"
              className={`size-11 rounded-none text-2xl ${
                icon === emoji ? "bg-bg-muted" : ""
              }`}
              aria-label={`${emoji} 아이콘 선택`}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>색상</Label>
        <div className="mb-2 flex items-center gap-2">
          <div
            className="w-10 h-10 rounded border border-border shrink-0"
            style={{ backgroundColor: color }}
          />
        </div>
        <div className="flex flex-wrap gap-2 p-2 border border-border rounded-md">
          {PALETTE.map((c) => (
            <Button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              variant="ghost"
              size="icon"
              className={`size-8 rounded-full border-2 p-0 transition-transform ${
                color === c ? "border-fg scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
              aria-label={`색 ${PALETTE.indexOf(c) + 1} 선택`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="excludeFromBudget"
          checked={excludeFromBudget}
          onChange={(e) => setExcludeFromBudget(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        <Label htmlFor="excludeFromBudget" className="cursor-pointer">
          예산 합계에서 제외
        </Label>
      </div>

      <div className="safe-area-pb flex gap-2 pt-4">
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
          {isSubmitting ? "추가 중..." : "추가"}
        </Button>
      </div>
    </form>
  );
}
