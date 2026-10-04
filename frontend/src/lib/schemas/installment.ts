import { z } from "zod";

export const installmentInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "이름은 필수입니다")
      .max(50, "이름은 50자까지 쓸 수 있습니다"),
    totalAmount: z
      .number()
      .int("총 금액은 정수여야 합니다")
      .min(1, "총 금액은 1원 이상이어야 합니다")
      .max(9_999_999_999, "총 금액이 너무 큽니다"),
    installmentMonths: z
      .number()
      .int("할부 개월 수는 정수여야 합니다")
      .min(2, "할부는 2개월 이상이어야 합니다")
      .max(60, "할부는 60개월까지 기록할 수 있습니다"),
    startMonth: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "첫 결제 월을 골라 주세요"),
    // optional 을 transform 뒤에 둔다. 앞에 두면 z.infer 의 memo 가 필수 키가 된다
    memo: z
      .string()
      .trim()
      .max(200, "메모는 200자까지 쓸 수 있습니다")
      .transform((v) => (v === "" ? undefined : v))
      .optional(),
  })
  .refine((v) => v.totalAmount >= v.installmentMonths, {
    message: "총 금액은 할부 개월 수 이상이어야 합니다",
    path: ["totalAmount"],
  });
