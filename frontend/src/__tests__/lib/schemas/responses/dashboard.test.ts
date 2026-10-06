import {
  categoryBreakdownResponseSchema,
  monthlyTrendResponseSchema,
} from "@/lib/schemas/responses/dashboard";

const CATEGORY_UUID = "33333333-3333-3333-3333-333333333331";

/** 백엔드 카테고리 분포 항목. 전월 비교를 하지 않으면 deltaPercent 키가 null 로 온다. */
const breakdownItem = {
  categoryUuid: CATEGORY_UUID,
  name: "식비",
  icon: "🍚",
  color: "#f97316",
  totalAmount: 16200,
  percentage: 100.0,
  deltaPercent: null,
  previousAmount: null,
};

function breakdown(items: unknown[]) {
  return { year: 2026, month: 10, totalExpense: 16200, items };
}

function without(source: Record<string, unknown>, key: string) {
  const copy = { ...source };
  delete copy[key];
  return copy;
}

function issuePaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues.map((issue) => issue.path.join(".")) ?? [];
}

describe("categoryBreakdownResponseSchema", () => {
  it("deltaPercent 가 null 인 항목을 받는다", () => {
    const result = categoryBreakdownResponseSchema.safeParse(breakdown([breakdownItem]));

    expect(result.success).toBe(true);
    expect(result.data?.items[0].deltaPercent).toBeNull();
  });

  it("전월 대비 소수 비율과 null 인 이름, 아이콘, 색을 받는다", () => {
    const result = categoryBreakdownResponseSchema.safeParse(
      breakdown([{ ...breakdownItem, name: null, icon: null, color: null, deltaPercent: -25.51 }])
    );

    expect(result.success).toBe(true);
    expect(result.data?.items[0]).toMatchObject({ name: null, deltaPercent: -25.51 });
  });

  it("빈 항목 목록을 받는다", () => {
    expect(categoryBreakdownResponseSchema.safeParse(breakdown([])).success).toBe(true);
  });

  it("previousAmount 가 null 이거나 0 이어도 받고, 모르는 필드는 버린다", () => {
    const result = categoryBreakdownResponseSchema.safeParse(
      breakdown([{ ...breakdownItem, unknownField: 1 }])
    );

    expect(result.success).toBe(true);
    expect(result.data?.items[0]).not.toHaveProperty("unknownField");
    expect(
      categoryBreakdownResponseSchema.safeParse(
        breakdown([{ ...breakdownItem, previousAmount: 0 }])
      ).success
    ).toBe(true);
  });

  it.each(["deltaPercent", "previousAmount", "totalAmount", "categoryUuid"])(
    "항목의 %s 키가 없으면 거부한다",
    (key) => {
      const result = categoryBreakdownResponseSchema.safeParse(
        breakdown([without(breakdownItem, key)])
      );

      expect(result.success).toBe(false);
      expect(issuePaths(result)).toContain(`items.0.${key}`);
    }
  );

  it("금액이 문자열이면 거부한다", () => {
    const result = categoryBreakdownResponseSchema.safeParse(
      breakdown([{ ...breakdownItem, totalAmount: "16200" }])
    );

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("items.0.totalAmount");
  });
});

describe("monthlyTrendResponseSchema", () => {
  const trend = {
    points: [
      { year: 2026, month: 9, totalExpense: 150 },
      { year: 2026, month: 10, totalExpense: 180 },
    ],
    average: 165.0,
  };

  it("월별 점과 평균을 받는다", () => {
    expect(monthlyTrendResponseSchema.safeParse(trend)).toEqual({ success: true, data: trend });
  });

  it("점이 없는 기간을 받는다", () => {
    expect(monthlyTrendResponseSchema.safeParse({ points: [], average: 0 }).success).toBe(true);
  });

  it("average 가 없으면 거부한다", () => {
    const result = monthlyTrendResponseSchema.safeParse(without(trend, "average"));

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("average");
  });

  it("점의 totalExpense 가 없으면 거부한다", () => {
    const result = monthlyTrendResponseSchema.safeParse({
      ...trend,
      points: [without(trend.points[0], "totalExpense")],
    });

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("points.0.totalExpense");
  });
});
