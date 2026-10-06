"use client";

import { getCategoryToneStyle } from "@/lib/utils/category-tone";
import { formatCurrency } from "@/lib/utils/format";
import type { TransactionRowKind } from "@/types/transaction";
import { format, parseISO } from "date-fns";
import type { KeyboardEvent, ReactNode } from "react";

export interface TxBase {
  uuid: string;
  amount: number;
  description: string | null;
  date?: string | null;
  excludeFromBudget?: boolean;
  category: {
    uuid: string;
    name: string;
    icon: string | null;
    color?: string | null;
  } | null;
  createdBy?: { uuid?: string; name: string; colorClass?: string } | null;
}

interface TransactionRowProps {
  tx: TxBase;
  variant: "compact" | "full";
  kind?: TransactionRowKind;
  metadata?: string;
  trailing?: ReactNode;
  onEdit?: () => void;
}

export function TransactionRow({
  tx,
  variant,
  kind = "expense",
  metadata,
  trailing,
  onEdit,
}: TransactionRowProps) {
  const categoryName = tx.category?.name ?? "기타";
  const categoryIcon = tx.category?.icon ?? "💸";
  const toneStyle = getCategoryToneStyle(categoryName);
  const title = tx.description || categoryName;
  const time = tx.date ? format(parseISO(tx.date), "HH:mm") : undefined;
  const displayDetail = metadata ?? time;
  const isBudgetExcluded = kind === "expense" && tx.excludeFromBudget === true;
  const detailItems = [
    tx.description
      ? { label: categoryName, showCreatorMarker: false, hideOnDesktop: variant === "full" }
      : undefined,
    tx.createdBy?.name
      ? {
          label: tx.createdBy.name,
          showCreatorMarker: Boolean(tx.createdBy.colorClass),
          hideOnDesktop: variant === "full",
        }
      : undefined,
    displayDetail ? { label: displayDetail, showCreatorMarker: false, hideOnDesktop: false } : undefined,
    isBudgetExcluded
      ? { label: "예산 제외", showCreatorMarker: false, hideOnDesktop: false }
      : undefined,
  ].filter(
    (item): item is { label: string; showCreatorMarker: boolean; hideOnDesktop: boolean } =>
      Boolean(item)
  );
  const isIncome = kind === "income";
  const amount = `${isIncome ? "+" : ""}${formatCurrency(Math.abs(tx.amount))}`;
  const isClickable = Boolean(onEdit);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const isActivationKey = event.key === "Enter" || event.key === " ";
    if (onEdit && isActivationKey) {
      event.preventDefault();
      onEdit();
    }
  }

  function renderDetails() {
    if (detailItems.length === 0) {
      return null;
    }

    return (
      <p
        className={`text-xs text-fg-muted ${
          variant === "full" && !displayDetail ? "md:hidden" : ""
        }`}
      >
        {detailItems.map((item, index) => (
          <span
            key={`${item.label}-${index}`}
            className={item.hideOnDesktop ? "md:hidden" : undefined}
          >
            {index > 0 && (
              <span
                aria-hidden="true"
                className={
                  variant === "full" && (item.hideOnDesktop || detailItems[index - 1].hideOnDesktop)
                    ? "md:hidden"
                    : undefined
                }
              >
                {" · "}
              </span>
            )}
            {item.showCreatorMarker && tx.createdBy?.colorClass && (
              <span
                aria-hidden="true"
                className={`mr-1 inline-block size-1.5 rounded-full ${tx.createdBy.colorClass}`}
              />
            )}
            {item.label}
          </span>
        ))}
      </p>
    );
  }

  return (
    <div
      className={`flex min-h-14 items-center gap-3 px-0 py-2.5 active:bg-bg-muted focus-visible:outline-2 focus-visible:outline-brand-500 focus-visible:outline-offset-2 ${
        variant === "full"
          ? "md:grid md:grid-cols-[44px_1fr_110px_28px_140px] md:gap-4 md:py-3"
          : ""
      }`}
      onClick={onEdit}
      onKeyDown={handleKeyDown}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-base md:size-[38px]"
        style={toneStyle}
      >
        {categoryIcon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-fg">{title}</p>
        {renderDetails()}
      </div>

      {variant === "full" && (
        <div className="hidden items-center md:flex">
          <span
            className="max-w-[104px] truncate rounded-full px-2 py-0.5 text-xs font-medium"
            style={toneStyle}
          >
            {categoryName}
          </span>
        </div>
      )}

      {variant === "full" && (
        <div className="hidden items-center justify-center md:flex">
          {tx.createdBy?.name && tx.createdBy.colorClass && (
            <span
              aria-label={tx.createdBy.name}
              className={`size-2 rounded-full ${tx.createdBy.colorClass}`}
            />
          )}
        </div>
      )}

      <div className="flex shrink-0 flex-col items-end">
        <span className={`num text-[15px] font-bold ${isIncome ? "text-income" : "text-expense"}`}>
          {amount}
        </span>
        {trailing}
      </div>
    </div>
  );
}
