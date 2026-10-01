import { getMissingField } from "@/lib/client/transaction-form-readiness";

describe("getMissingField", () => {
  const validExpense = {
    type: "expense" as const,
    amount: 1000,
    categoryUuid: "category-1",
    date: "2026-10-02",
    name: "",
    dayOfMonth: undefined,
  };

  it("지출과 수입은 금액, 카테고리, 날짜 순서로 확인한다", () => {
    expect(getMissingField({ ...validExpense, amount: 0 })).toBe("amount");
    expect(getMissingField({ ...validExpense, amount: Number.NaN })).toBe("amount");
    expect(getMissingField({ ...validExpense, amount: Number.POSITIVE_INFINITY })).toBe("amount");
    expect(getMissingField({ ...validExpense, categoryUuid: null })).toBe("category");
    expect(getMissingField({ ...validExpense, date: "" })).toBe("date");
    expect(getMissingField({ ...validExpense, type: "income" })).toBeNull();
  });

  it("고정지출은 금액, 카테고리, 이름, 결제일 순서로 확인한다", () => {
    const validRecurring = {
      ...validExpense,
      type: "recurring" as const,
      name: "월세",
      dayOfMonth: 15,
    };

    expect(getMissingField({ ...validRecurring, amount: 0 })).toBe("amount");
    expect(getMissingField({ ...validRecurring, categoryUuid: null })).toBe("category");
    expect(getMissingField({ ...validRecurring, name: " " })).toBe("name");
    expect(getMissingField({ ...validRecurring, dayOfMonth: 0 })).toBe("dayOfMonth");
    expect(getMissingField({ ...validRecurring, dayOfMonth: 29 })).toBe("dayOfMonth");
    expect(getMissingField({ ...validRecurring, dayOfMonth: 15.5 })).toBe("dayOfMonth");
    expect(getMissingField(validRecurring)).toBeNull();
  });
});
