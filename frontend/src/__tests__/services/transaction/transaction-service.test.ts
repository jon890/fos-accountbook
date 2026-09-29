/**
 * transaction-service 단위 테스트
 * @jest-environment node
 */

import {
  groupTransactionsWithTotal,
  applyClientFilters,
} from "@/services/transaction/transaction-service";

// group-by-date 는 실제 구현 사용 (순수 함수, 의존성 없음)

interface TestItem {
  uuid: string;
  date: string;
  amount: number;
  description?: string | null;
}

const makeItem = (
  uuid: string,
  date: string,
  amount: number,
  description?: string | null
): TestItem => ({ uuid, date, amount, description });

describe("groupTransactionsWithTotal", () => {
  it("5건 → 3 그룹, 그룹별 합계 정확", () => {
    const items: TestItem[] = [
      makeItem("1", "2024-03-01T10:00:00", 10000),
      makeItem("2", "2024-03-01T15:00:00", 20000),
      makeItem("3", "2024-03-02T09:00:00", 5000),
      makeItem("4", "2024-03-03T11:00:00", 3000),
      makeItem("5", "2024-03-03T14:00:00", 7000),
    ];

    const groups = groupTransactionsWithTotal(items);

    expect(groups).toHaveLength(3);
    expect(groups[0].dateKey).toBe("2024-03-01");
    expect(groups[0].totalAmount).toBe(30000);
    expect(groups[0].items).toHaveLength(2);

    expect(groups[1].dateKey).toBe("2024-03-02");
    expect(groups[1].totalAmount).toBe(5000);
    expect(groups[1].items).toHaveLength(1);

    expect(groups[2].dateKey).toBe("2024-03-03");
    expect(groups[2].totalAmount).toBe(10000);
    expect(groups[2].items).toHaveLength(2);
  });

  it("음수 amount 도 절댓값으로 합산", () => {
    const items: TestItem[] = [
      makeItem("1", "2024-03-01T10:00:00", -15000),
      makeItem("2", "2024-03-01T11:00:00", -5000),
    ];

    const groups = groupTransactionsWithTotal(items);

    expect(groups).toHaveLength(1);
    expect(groups[0].totalAmount).toBe(20000);
  });

  it("빈 배열 → []", () => {
    expect(groupTransactionsWithTotal([])).toEqual([]);
  });

  it("label 필드 포함 (기존 groupByDate 재사용 검증)", () => {
    const items: TestItem[] = [makeItem("1", "2024-03-01T10:00:00", 1000)];
    const groups = groupTransactionsWithTotal(items);
    expect(groups[0].label).toBeDefined();
    expect(typeof groups[0].label).toBe("string");
  });
});

describe("applyClientFilters", () => {
  const items: TestItem[] = [
    makeItem("1", "2024-03-01", 5000, "커피"),
    makeItem("2", "2024-03-01", 15000, "점심 식사"),
    makeItem("3", "2024-03-01", 30000, "쇼핑"),
    makeItem("4", "2024-03-01", -8000, "환불"),
    makeItem("5", "2024-03-01", 50000, null),
  ];

  it("필터 없음 → 전체 반환", () => {
    expect(applyClientFilters(items, {})).toHaveLength(5);
  });

  it("amountMin 경계 — 절댓값 기준", () => {
    const result = applyClientFilters(items, { amountMin: 8000 });
    // 5000 제외, 8000(절댓값)·15000·30000·50000 포함
    expect(result.map((i) => i.uuid)).toEqual(["2", "3", "4", "5"]);
  });

  it("amountMax 경계 — 절댓값 기준", () => {
    const result = applyClientFilters(items, { amountMax: 15000 });
    // 5000·8000(절댓값)·15000 포함, 30000·50000 제외
    expect(result.map((i) => i.uuid)).toEqual(["1", "2", "4"]);
  });

  it("amountMin + amountMax 범위", () => {
    const result = applyClientFilters(items, { amountMin: 10000, amountMax: 30000 });
    expect(result.map((i) => i.uuid)).toEqual(["2", "3"]);
  });

  it("q 부분 일치 — case-insensitive", () => {
    const mixedItems: TestItem[] = [
      makeItem("a", "2024-03-01", 1000, "Coffee Shop"),
      makeItem("b", "2024-03-01", 2000, "점심 식사"),
      makeItem("c", "2024-03-01", 3000, "coffee break"),
    ];
    const result = applyClientFilters(mixedItems, { q: "coffee" });
    expect(result.map((i) => i.uuid)).toEqual(["a", "c"]);
  });

  it("q 필터 — description null 항목은 제외", () => {
    const result = applyClientFilters(items, { q: "커피" });
    expect(result.map((i) => i.uuid)).toEqual(["1"]);
  });

  it("amountMin + q 복합 필터", () => {
    const result = applyClientFilters(items, { amountMin: 10000, q: "식사" });
    expect(result.map((i) => i.uuid)).toEqual(["2"]);
  });
});
