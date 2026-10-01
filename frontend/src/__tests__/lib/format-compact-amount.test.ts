import { formatCompactAmount } from "@/lib/utils/format";

describe("금액 줄임 표기", () => {
  it.each([
    [0, "0"], [800, "800"], [9800, "9.8천"], [10000, "1만"],
    [32400, "3.2만"], [1234567, "123만"], [-5000, "-5천"],
    [999, "999"], [1000, "1천"], [999999, "100만"], [1000000, "100만"],
    [9949, "9.9천"], [9960, "1만"], [9999, "1만"], [-9960, "-1만"],
  ])("%s원을 %s으로 표시한다", (amount, expected) => {
    expect(formatCompactAmount(amount)).toBe(expected);
  });
});
