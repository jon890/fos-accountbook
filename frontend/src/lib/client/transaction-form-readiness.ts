import type { TransactionType } from "@/types/transaction";

export type MissingTransactionField =
  | "amount"
  | "category"
  | "date"
  | "name"
  | "dayOfMonth";

interface TransactionFormReadinessInput {
  type: TransactionType;
  amount: number;
  categoryUuid: string | null;
  date: string;
  name: string;
  dayOfMonth: number | undefined;
}

export function getMissingField({
  type,
  amount,
  categoryUuid,
  date,
  name,
  dayOfMonth,
}: TransactionFormReadinessInput): MissingTransactionField | null {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "amount";
  }

  if (!categoryUuid) {
    return "category";
  }

  if (type !== "recurring") {
    return date ? null : "date";
  }

  if (!name.trim()) {
    return "name";
  }

  if (
    !dayOfMonth ||
    !Number.isInteger(dayOfMonth) ||
    dayOfMonth < 1 ||
    dayOfMonth > 28
  ) {
    return "dayOfMonth";
  }

  return null;
}
