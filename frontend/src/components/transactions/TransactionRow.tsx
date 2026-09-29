"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getCategoryToneStyle } from "@/lib/utils/category-tone";
import { formatCurrency } from "@/lib/utils/format";
import { format, parseISO } from "date-fns";

export interface TxBase {
  uuid: string;
  amount: number;
  description: string | null;
  date: string;
  category: {
    uuid: string;
    name: string;
    icon: string;
    color?: string | null;
  } | null;
  createdBy?: { uuid?: string; name: string } | null;
}

interface TransactionRowProps {
  tx: TxBase;
  variant: "compact" | "full";
  onEdit?: () => void;
}

export function TransactionRow({
  tx,
  variant,
  onEdit,
}: TransactionRowProps) {
  const catName = tx.category?.name ?? "기타";
  const catIcon = tx.category?.icon ?? "💸";
  const toneStyle = getCategoryToneStyle(catName);
  const timeStr = format(parseISO(tx.date), "HH:mm");
  const absAmount = Math.abs(tx.amount);
  const isClickable = !!onEdit;

  if (variant === "compact") {
    return (
      <div
        className="flex items-center gap-3 py-2.5 px-0"
        onClick={onEdit}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
      >
        {/* 카테고리 아이콘 */}
        <div
          className="size-9 shrink-0 rounded-xl flex items-center justify-center text-base"
          style={toneStyle}
        >
          {catIcon}
        </div>

        {/* 메모 + 카테고리·시간 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-fg truncate">
            {tx.description || catName}
          </p>
          <p className="text-[11.5px] text-fg-muted">
            {catName} · {timeStr}
          </p>
        </div>

        {/* 금액 + 아바타 */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="num text-sm font-bold text-fg">
            {formatCurrency(absAmount)}
          </span>
          {tx.createdBy?.name ? (
            <Avatar className="size-4">
              <AvatarFallback className="text-[8px] font-medium bg-brand-200 text-brand-800">
                {tx.createdBy.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="size-4" />
          )}
        </div>
      </div>
    );
  }

  // full: mobile = compact flex / desktop = 5-col grid
  return (
    <div
      className="flex items-center gap-3 py-2.5 md:grid md:grid-cols-[44px_1fr_110px_28px_140px] md:gap-4 md:items-center md:py-3"
      onClick={onEdit}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {/* Col 1: 카테고리 아이콘 38px */}
      <div
        className="size-9 md:size-[38px] shrink-0 rounded-xl flex items-center justify-center text-base"
        style={toneStyle}
      >
        {catIcon}
      </div>

      {/* Col 2: 메모 + 시간 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-fg truncate">
          {tx.description || catName}
        </p>
        <p className="text-[11.5px] text-fg-muted">
          <span className="md:hidden">{catName} · </span>
          {timeStr}
        </p>
      </div>

      {/* Col 3: 카테고리 chip — desktop only */}
      <div className="hidden md:flex items-center">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full truncate max-w-[104px]"
          style={toneStyle}
        >
          {catName}
        </span>
      </div>

      {/* Col 4: 아바타 22px — desktop only */}
      <div className="hidden md:flex items-center justify-center">
        {tx.createdBy?.name ? (
          <Avatar className="size-[22px]">
            <AvatarFallback className="text-[8px] font-medium bg-brand-200 text-brand-800">
              {tx.createdBy.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="size-[22px]" />
        )}
      </div>

      {/* Col 5: 금액 right-aligned */}
      <div className="flex flex-col items-end shrink-0">
        <span className="num text-sm md:text-[15px] font-bold text-fg">
          {formatCurrency(absAmount)}
        </span>
        {/* 모바일에서만 아바타 표시 */}
        <div className="md:hidden mt-0.5">
          {tx.createdBy?.name ? (
            <Avatar className="size-4">
              <AvatarFallback className="text-[8px] font-medium bg-brand-200 text-brand-800">
                {tx.createdBy.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="size-4" />
          )}
        </div>
      </div>
    </div>
  );
}
