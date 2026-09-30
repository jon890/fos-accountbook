import { getDatePartsInTimezone } from "@/lib/utils/date-timezone";

const now = new Date("2026-09-30T16:00:00Z");

describe("시간대의 날짜 구성", () => {
  it("서울은 UTC 9월 30일 16시에 다음 달 1일이다", () => {
    expect(getDatePartsInTimezone("Asia/Seoul", now)).toEqual({ year: 2026, month: 10, day: 1, date: "2026-10-01" });
  });

  it("뉴욕은 같은 시각에도 9월 30일이다", () => {
    expect(getDatePartsInTimezone("America/New_York", now)).toEqual({ year: 2026, month: 9, day: 30, date: "2026-09-30" });
  });

  it.each([undefined, null, "", "invalid/timezone"])("누락되거나 잘못된 시간대 %s는 서울을 사용한다", (timezone) => {
    expect(getDatePartsInTimezone(timezone, now)).toEqual({ year: 2026, month: 10, day: 1, date: "2026-10-01" });
  });

  it("시각 인자를 생략하면 현재 시각을 사용한다", () => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    expect(getDatePartsInTimezone("Asia/Seoul").date).toBe("2026-10-01");
    jest.useRealTimers();
  });
});
