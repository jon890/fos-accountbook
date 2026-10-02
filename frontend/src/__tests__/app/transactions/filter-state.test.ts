import {
  buildFilterUrl,
  countActiveFilters,
  readFilterDraft,
  resetFilterDraft,
  validateAmountRange,
  validateDateRange,
  validateFilterDraft,
} from "@/app/(authenticated)/transactions/_components/filter-state";

jest.mock("@/lib/utils/date-timezone", () => ({
  getMonthRange: () => ({ startDate: "2026-10-01", endDate: "2026-10-31" }),
  getLastNMonthsRange: () => ({ startDate: "2026-07-02", endDate: "2026-10-02" }),
  getLastYearRange: () => ({ startDate: "2025-10-02", endDate: "2026-10-02" }),
}));

const TZ = "Asia/Seoul";

describe("readFilterDraft", () => {
  it("주소에 값이 없으면 이번 달, 전체 카테고리, 금액 없음이다", () => {
    expect(readFilterDraft(new URLSearchParams(""), TZ)).toEqual({
      range: "thisMonth",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      categoryId: "all",
      amountMin: "",
      amountMax: "",
    });
  });

  it("주소의 기간이 3개월 범위와 같으면 3개월로 읽고 다르면 직접 입력으로 읽는다", () => {
    expect(
      readFilterDraft(new URLSearchParams("startDate=2026-07-02&endDate=2026-10-02"), TZ).range
    ).toBe("3months");
    expect(
      readFilterDraft(new URLSearchParams("startDate=2026-09-05&endDate=2026-09-20"), TZ).range
    ).toBe("custom");
  });

  it("주소에 없는 기간은 넘겨 받은 기본값으로 채운다", () => {
    const draft = readFilterDraft(new URLSearchParams("categoryId=c1&amountMin=5000"), TZ, {
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });
    expect(draft).toMatchObject({ range: "thisMonth", categoryId: "c1", amountMin: "5000" });
  });
});

describe("countActiveFilters", () => {
  it("기본값이면 0이다", () => {
    expect(countActiveFilters(resetFilterDraft(TZ))).toBe(0);
  });

  it("이번 달이 아닌 기간, 카테고리, 금액을 각각 하나로 센다", () => {
    const draft = readFilterDraft(
      new URLSearchParams("startDate=2026-09-05&endDate=2026-09-20&categoryId=c1&amountMax=0"),
      TZ
    );
    expect(countActiveFilters(draft)).toBe(3);
  });

  it("최소와 최대를 함께 넣어도 금액은 하나다", () => {
    const draft = readFilterDraft(new URLSearchParams("amountMin=1&amountMax=2"), TZ);
    expect(countActiveFilters(draft)).toBe(1);
  });
});

describe("검증", () => {
  it("날짜가 비었거나 실제 날짜가 아니면 거부한다", () => {
    expect(validateDateRange("", "2026-10-02")).not.toBeNull();
    expect(validateDateRange("2026-02-30", "2026-03-02")).not.toBeNull();
  });

  it("종료일이 시작일보다 이르면 거부하고 같은 날은 허용한다", () => {
    expect(validateDateRange("2026-10-02", "2026-10-01")).not.toBeNull();
    expect(validateDateRange("2026-10-02", "2026-10-02")).toBeNull();
  });

  it("금액은 빈 값이나 0 이상의 유한한 숫자만 허용한다", () => {
    expect(validateAmountRange("", "")).toBeNull();
    expect(validateAmountRange("0", "")).toBeNull();
    expect(validateAmountRange("-1", "")).not.toBeNull();
    expect(validateAmountRange("abc", "")).not.toBeNull();
    expect(validateAmountRange("", "Infinity")).not.toBeNull();
  });

  it("최소가 최대보다 크면 거부한다", () => {
    expect(validateAmountRange("2000", "1000")).not.toBeNull();
    expect(validateAmountRange("1000", "1000")).toBeNull();
  });

  it("날짜 오류를 금액 오류보다 먼저 알린다", () => {
    const draft = { ...resetFilterDraft(TZ), startDate: "", amountMin: "2", amountMax: "1" };
    expect(validateFilterDraft(draft)).toBe("시작일과 종료일을 모두 입력해주세요");
  });
});

describe("buildFilterUrl", () => {
  it("tab 과 q 를 보존하고 limit 을 지운다", () => {
    const draft = { ...resetFilterDraft(TZ), categoryId: "c1", amountMin: "1000" };
    const url = buildFilterUrl("tab=incomes&q=%EA%B8%89%EC%97%AC&limit=600", draft);
    const params = new URL(url, "http://x").searchParams;
    expect(url.startsWith("/transactions?")).toBe(true);
    expect(params.get("tab")).toBe("incomes");
    expect(params.get("q")).toBe("급여");
    expect(params.get("categoryId")).toBe("c1");
    expect(params.get("amountMin")).toBe("1000");
    expect(params.has("limit")).toBe(false);
  });

  it("기본값으로 초기화한 상태는 필터 값을 모두 지운다", () => {
    const url = buildFilterUrl(
      "startDate=2026-09-01&endDate=2026-09-30&categoryId=c1&amountMin=1&amountMax=2",
      resetFilterDraft(TZ)
    );
    expect(url).toBe("/transactions");
  });

  it("이번 달이 아닌 기간은 시작일과 종료일을 넣는다", () => {
    const draft = {
      ...resetFilterDraft(TZ),
      range: "custom" as const,
      startDate: "2026-09-05",
      endDate: "2026-09-20",
    };
    const params = new URL(buildFilterUrl("", draft), "http://x").searchParams;
    expect(params.get("startDate")).toBe("2026-09-05");
    expect(params.get("endDate")).toBe("2026-09-20");
  });
});
