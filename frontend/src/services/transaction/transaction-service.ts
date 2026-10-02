import { groupByDate } from "@/lib/utils/group-by-date";
import type { DateGroupWithTotal } from "@/types/transaction";

export function groupTransactionsWithTotal<T extends { date: string; amount: number }>(
  items: T[]
): DateGroupWithTotal<T>[] {
  const groups = groupByDate(items);
  return groups.map((g) => ({
    ...g,
    totalAmount: g.items.reduce((s, x) => s + Math.abs(x.amount), 0),
  }));
}

export function applyClientFilters<
  T extends { amount: number; description?: string | null }
>(
  items: T[],
  filters: {
    amountMin?: number;
    amountMax?: number;
    q?: string;
    categoryNameOf?: (item: T) => string | undefined;
  }
): T[] {
  const { amountMin, amountMax, q, categoryNameOf } = filters;
  const lowerQ = q?.trim().toLowerCase();

  return items.filter((item) => {
    const abs = Math.abs(item.amount);
    if (amountMin !== undefined && abs < amountMin) return false;
    if (amountMax !== undefined && abs > amountMax) return false;

    if (lowerQ) {
      const matchesDescription = (item.description ?? "")
        .toLowerCase()
        .includes(lowerQ);
      const matchesCategory = categoryNameOf?.(item)
        ?.toLowerCase()
        .includes(lowerQ);

      if (!matchesDescription && !matchesCategory) return false;
    }

    return true;
  });
}
