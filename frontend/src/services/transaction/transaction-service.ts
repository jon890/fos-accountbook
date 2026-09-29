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
  filters: { amountMin?: number; amountMax?: number; q?: string }
): T[] {
  const { amountMin, amountMax, q } = filters;
  const lowerQ = q ? q.toLowerCase() : undefined;

  return items.filter((item) => {
    const abs = Math.abs(item.amount);
    if (amountMin !== undefined && abs < amountMin) return false;
    if (amountMax !== undefined && abs > amountMax) return false;
    if (lowerQ && !(item.description ?? "").toLowerCase().includes(lowerQ))
      return false;
    return true;
  });
}
