import { installmentResponseSchema } from "@/lib/schemas/responses/installment";

const response = {
  uuid: "11111111-1111-4111-8111-111111111111",
  userUuid: "22222222-2222-4222-8222-222222222222",
  name: "냉장고",
  totalAmount: 1200000,
  installmentMonths: 12,
  startMonth: "2026-10",
  endMonth: "2027-09",
  memo: "삼성카드",
  monthlyAmount: 100000,
  firstMonthAmount: 100000,
  currentRound: 1,
  thisMonthAmount: 100000,
  remainingAmount: 1100000,
  progress: "IN_PROGRESS",
  createdAt: "2026-10-02T00:00:00",
  updatedAt: "2026-10-02T00:00:00",
};

describe("installmentResponseSchema", () => {
  it("백엔드 응답 예시가 통과한다", () => {
    expect(installmentResponseSchema.safeParse(response).success).toBe(true);
  });

  it("memo 가 null 이어도 통과한다", () => {
    const result = installmentResponseSchema.safeParse({
      ...response,
      memo: null,
    });

    expect(result.success).toBe(true);
  });

  it("progress 가 정의되지 않은 값이면 실패한다", () => {
    const result = installmentResponseSchema.safeParse({
      ...response,
      progress: "DONE",
    });

    expect(result.success).toBe(false);
  });
});
