import { DAY_OF_MONTH_MESSAGE } from "@/lib/schemas/recurring-expense";
import type { TransactionType } from "@/types/transaction";

export type MissingTransactionField =
  | "amount"
  | "category"
  | "date"
  | "name"
  | "dayOfMonth";

// 저장 버튼 위 안내 문구. 등록과 수정 창이 함께 쓴다 (ADR-F40).
export const MISSING_FIELD_MESSAGE: Record<MissingTransactionField, string> = {
  amount: "금액을 입력해 주세요",
  category: "카테고리를 골라 주세요",
  date: "날짜를 골라 주세요",
  name: "이름을 입력해 주세요",
  dayOfMonth: DAY_OF_MONTH_MESSAGE,
};

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
