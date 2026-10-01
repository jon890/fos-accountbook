import { z } from "zod";

export const recurringExpenseSchema = z.object({
  name: z.string().trim().min(1, "이름은 필수입니다"),
  categoryUuid: z.string().uuid("카테고리를 선택해주세요"),
  amount: z.number().positive("금액은 0보다 커야 합니다"),
  dayOfMonth: z
    .number()
    .int()
    .min(1, "결제일을 1~28 중에서 입력해 주세요")
    .max(28, "결제일을 1~28 중에서 입력해 주세요"),
});

export const updateRecurringExpenseSchema = recurringExpenseSchema.partial();
