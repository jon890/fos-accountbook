"use client";

import { cn } from "@/lib/client/utils";
import { getCategoryToneKey, type CategoryToneKey } from "@/lib/utils/category-tone";
import type { CategoryResponse } from "@/types/category";

interface CategoryGridProps {
  categories: CategoryResponse[];
  selectedUuid: string | null;
  onSelect: (uuid: string) => void;
  disabled?: boolean;
}

const TONE_CLASS: Record<CategoryToneKey, { bg: string; border: string; text: string }> = {
  food:      { bg: "bg-[var(--color-cat-food-bg)]",      border: "border-[var(--color-cat-food-fg)]",      text: "text-[var(--color-cat-food-fg)]" },
  cafe:      { bg: "bg-[var(--color-cat-cafe-bg)]",      border: "border-[var(--color-cat-cafe-fg)]",      text: "text-[var(--color-cat-cafe-fg)]" },
  transit:   { bg: "bg-[var(--color-cat-transit-bg)]",   border: "border-[var(--color-cat-transit-fg)]",   text: "text-[var(--color-cat-transit-fg)]" },
  telecom:   { bg: "bg-[var(--color-cat-telecom-bg)]",   border: "border-[var(--color-cat-telecom-fg)]",   text: "text-[var(--color-cat-telecom-fg)]" },
  home:      { bg: "bg-[var(--color-cat-home-bg)]",      border: "border-[var(--color-cat-home-fg)]",      text: "text-[var(--color-cat-home-fg)]" },
  shopping:  { bg: "bg-[var(--color-cat-shopping-bg)]",  border: "border-[var(--color-cat-shopping-fg)]",  text: "text-[var(--color-cat-shopping-fg)]" },
  health:    { bg: "bg-[var(--color-cat-health-bg)]",    border: "border-[var(--color-cat-health-fg)]",    text: "text-[var(--color-cat-health-fg)]" },
  leisure:   { bg: "bg-[var(--color-cat-leisure-bg)]",   border: "border-[var(--color-cat-leisure-fg)]",   text: "text-[var(--color-cat-leisure-fg)]" },
  education: { bg: "bg-[var(--color-cat-education-bg)]", border: "border-[var(--color-cat-education-fg)]", text: "text-[var(--color-cat-education-fg)]" },
  etc:       { bg: "bg-[var(--color-cat-etc-bg)]",       border: "border-[var(--color-cat-etc-fg)]",       text: "text-[var(--color-cat-etc-fg)]" },
};

export function CategoryGrid({
  categories,
  selectedUuid,
  onSelect,
  disabled,
}: CategoryGridProps) {
  return (
    <div className="grid gap-2 grid-cols-5 md:grid-cols-10" role="radiogroup" aria-label="카테고리 선택">
      {categories.map((category) => {
        const toneKey = getCategoryToneKey(category.name);
        const tone = TONE_CLASS[toneKey];
        const isSelected = selectedUuid === category.uuid;
        return (
          <button
            key={category.uuid}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onSelect(category.uuid)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] px-1 py-2 transition-colors disabled:opacity-50 disabled:pointer-events-none",
              isSelected
                ? cn(tone.bg, tone.border)
                : "bg-bg border-border hover:bg-bg-muted",
            )}
          >
            <span className="text-[32px] leading-none md:text-[28px]" aria-hidden="true">
              {category.icon ?? "📦"}
            </span>
            <span
              className={cn(
                "text-[11px] leading-tight truncate max-w-full",
                isSelected ? cn(tone.text, "font-bold") : "text-fg-muted font-medium",
              )}
            >
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
