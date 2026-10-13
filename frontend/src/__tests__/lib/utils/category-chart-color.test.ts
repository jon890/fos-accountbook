import { getCategoryChartColors } from "@/lib/utils/category-chart-color";
import { CATEGORY_PALETTE } from "@/lib/utils/category-palette";

function item(categoryUuid: string, color: string | null, totalAmount: number) {
  return { categoryUuid, color, totalAmount };
}

describe("getCategoryChartColors", () => {
  it("저장 색이 서로 다르면 그대로 쓴다", () => {
    const colors = getCategoryChartColors([
      item("a", CATEGORY_PALETTE[0], 300),
      item("b", CATEGORY_PALETTE[2], 200),
    ]);
    expect(colors.get("a")).toBe(CATEGORY_PALETTE[0]);
    expect(colors.get("b")).toBe(CATEGORY_PALETTE[2]);
  });

  it("저장 색이 같으면 금액이 큰 쪽이 갖고 작은 쪽은 쓰지 않은 팔레트 색을 받는다", () => {
    const colors = getCategoryChartColors([
      item("small", ` ${CATEGORY_PALETTE[0].toUpperCase()} `, 100),
      item("big", CATEGORY_PALETTE[0], 900),
    ]);
    expect(colors.get("big")).toBe(CATEGORY_PALETTE[0]);
    expect(colors.get("small")).toBe(CATEGORY_PALETTE[1]);
  });

  it("저장 색이 null 이면 쓰지 않은 팔레트 색을 받는다", () => {
    const colors = getCategoryChartColors([
      item("a", CATEGORY_PALETTE[0], 300),
      item("b", null, 200),
    ]);
    expect(colors.get("b")).toBe(CATEGORY_PALETTE[1]);
  });

  it("입력 순서와 관계없이 금액 순서로 배정한다", () => {
    const colors = getCategoryChartColors([
      item("low", null, 10),
      item("high", null, 90),
      item("mid", null, 50),
    ]);
    expect(colors.get("high")).toBe(CATEGORY_PALETTE[0]);
    expect(colors.get("mid")).toBe(CATEGORY_PALETTE[1]);
    expect(colors.get("low")).toBe(CATEGORY_PALETTE[2]);
  });

  it("13개를 넣어도 throw 하지 않고 모든 키에 색이 있다", () => {
    const items = Array.from({ length: 13 }, (_, index) => item(`c${index}`, null, 100 - index));
    const colors = getCategoryChartColors(items);
    expect(colors.size).toBe(13);
    expect(new Set(Array.from(colors.values())).size).toBe(12);
  });

  it("숫자 표기만 다른 저장 색과 팔레트 색을 같은 색으로 본다", () => {
    const colors = getCategoryChartColors([
      item("a", "oklch(0.56 0.14 35)", 20),
      item("b", null, 10),
    ]);
    expect(colors.get("a")).toBe("oklch(0.56 0.14 35)");
    expect(colors.get("b")).not.toBe("oklch(0.560 0.140 35)");
    expect(colors.get("b")).toBe(CATEGORY_PALETTE[1]);
  });

  it("숫자 표기만 다른 두 저장 색은 금액이 작은 쪽이 다른 색을 받는다", () => {
    const colors = getCategoryChartColors([
      item("big", "oklch(0.56 0.14 35)", 20),
      item("small", "oklch(0.560 0.140 35)", 10),
    ]);
    expect(colors.get("big")).toBe("oklch(0.56 0.14 35)");
    expect(colors.get("small")).toBe(CATEGORY_PALETTE[1]);
  });

  it("저장 색이 없는 12개 항목의 9~12번째는 다크 값이 있는 차트 토큰을 받는다", () => {
    const items = Array.from({ length: 12 }, (_, index) => item(`c${index}`, null, 100 - index));
    const colors = getCategoryChartColors(items);
    for (let index = 8; index < 12; index += 1) {
      expect(colors.get(`c${index}`)).toBe(`var(--color-chart-extra-${index - 7})`);
    }
  });
});
