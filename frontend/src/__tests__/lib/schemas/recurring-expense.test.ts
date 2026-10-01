import { recurringExpenseSchema } from "@/lib/schemas/recurring-expense";

describe("recurringExpenseSchema", () => {
  const validExpense = {
    name: "넷플릭스",
    categoryUuid: "123e4567-e89b-12d3-a456-426614174000",
    amount: 17000,
  };

  it.each([0, 29])("결제일 %i은 안내 문구와 함께 거부한다", (dayOfMonth) => {
    const result = recurringExpenseSchema.safeParse({ ...validExpense, dayOfMonth });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.dayOfMonth).toEqual([
        "결제일을 1~28 중에서 입력해 주세요",
      ]);
    }
  });
});
