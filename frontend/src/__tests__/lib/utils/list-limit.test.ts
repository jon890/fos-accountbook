import { MAX_LIST_LIMIT, parseListLimit } from "@/lib/utils/list-limit";

describe("parseListLimit", () => {
  it("값이 없거나 300 단위가 아니면 300을 사용한다", () => {
    expect(parseListLimit(undefined)).toBe(300);
    expect(parseListLimit("250")).toBe(300);
    expect(parseListLimit("300건")).toBe(300);
  });

  it("유효한 300 단위는 그대로 사용한다", () => {
    expect(parseListLimit("600")).toBe(600);
  });

  it("3000건을 넘는 값은 3000건으로 제한한다", () => {
    expect(parseListLimit("3300")).toBe(MAX_LIST_LIMIT);
  });
});
