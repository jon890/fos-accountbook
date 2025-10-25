"use client";

import { useState } from "react";
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
import { createCategoryAction } from "@/app/actions/category/create-category-action";
import { toast } from "sonner";
import type { CategoryResponse } from "@/types/api";

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyUuid: string;
  onSuccess: (category: CategoryResponse) => void;
}

// 자주 사용하는 이모지 목록
const commonEmojis = [
  "🍚",
  "☕",
  "🍰",
  "🏠",
  "🚗",
  "🛍️",
  "💊",
  "🎬",
  "📚",
  "📦",
  "💰",
  "🎮",
  "🏃",
  "✈️",
  "📱",
  "💻",
  "👕",
  "🎵",
  "🍕",
  "🍜",
  "🚌",
  "⚡",
  "🔧",
  "🎨",
  "📷",
  "🏥",
  "🏫",
  "💳",
  "🎁",
  "🌟",
];

// 자주 사용하는 색상
const commonColors = [
  "#ef4444",
  "#f59e0b",
  "#ec4899",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#f43f5e",
  "#14b8a6",
  "#6b7280",
  "#84cc16",
  "#f97316",
  "#a855f7",
  "#22c55e",
  "#0ea5e9",
];

export function AddCategoryDialog({
  open,
  onOpenChange,
  familyUuid,
  onSuccess,
}: AddCategoryDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [icon, setIcon] = useState("📦");
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
        name: name.trim(),
        color,
        icon,
      });

      if (result.success && result.data) {
        toast.success(result.message);
        onSuccess(result.data);
        onOpenChange(false);
        // 폼 리셋
        setName("");
        setColor("#6366f1");
        setIcon("📦");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("카테고리 생성 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>카테고리 추가</DialogTitle>
          <DialogDescription>
            새로운 지출 카테고리를 추가합니다
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 카테고리 이름 */}
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

          {/* 아이콘 선택 */}
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
                  className={`text-2xl p-1 hover:bg-gray-100 rounded ${
                    icon === emoji ? "bg-gray-200" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 색상 선택 */}
          <div className="space-y-2">
            <Label>색상</Label>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-10 h-10 rounded border"
                style={{ backgroundColor: color }}
              />
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="grid grid-cols-10 gap-1 p-2 border rounded-md">
              {commonColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded border-2 ${
                    color === c ? "border-gray-900" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* 버튼 */}
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
              {isSubmitting ? "추가 중..." : "추가"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
