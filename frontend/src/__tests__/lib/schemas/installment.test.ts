import { installmentInputSchema } from "@/lib/schemas/installment";

const valid = {
  name: "냉장고",
  totalAmount: 1200000,
  installmentMonths: 12,
  startMonth: "2026-10",
  memo: "삼성카드",
};

function firstMessage(input: unknown): string | undefined {
  const result = installmentInputSchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe("installmentInputSchema", () => {
  it("정상 입력이 통과한다", () => {
    const result = installmentInputSchema.safeParse(valid);

    expect(result).toEqual({ success: true, data: valid });
  });

  it("공백 메모는 undefined 가 된다", () => {
    const result = installmentInputSchema.safeParse({ ...valid, memo: "   " });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.memo).toBeUndefined();
  });

  it.each([
    ["개월 1", { installmentMonths: 1 }, "할부는 2개월 이상이어야 합니다"],
    ["개월 61", { installmentMonths: 61 }, "할부는 60개월까지 기록할 수 있습니다"],
    ["startMonth 13월", { startMonth: "2026-13" }, "첫 결제 월을 골라 주세요"],
    [
      "총액 5 개월 12",
      { totalAmount: 5 },
      "총 금액은 할부 개월 수 이상이어야 합니다",
    ],
    ["공백 이름", { name: "   " }, "이름은 필수입니다"],
  ])("%s 는 실패하고 안내 문구를 낸다", (_name, override, message) => {
    expect(firstMessage({ ...valid, ...override })).toBe(message);
  });
});
