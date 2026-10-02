import { z } from "zod";

export const budgetItemInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "이름은 필수입니다")
    .max(30, "이름은 30자까지 쓸 수 있습니다"),
  monthlyLimit: z
    .number()
    .int("한도는 0 이상이어야 합니다")
    .min(0, "한도는 0 이상이어야 합니다"),
  categoryUuids: z
    .array(z.string().uuid())
    .min(1, "카테고리를 하나 이상 골라 주세요"),
});
