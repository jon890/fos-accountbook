/**
 * group-by-date 유틸리티 함수 테스트
 *
 * Unit Test:
 * - 순수 함수 테스트
 * - date-fns isToday/isYesterday 모킹으로 날짜 테스트 안정화
 */

import { getDateLabel, groupByDate } from "@/lib/utils/group-by-date";

jest.mock("date-fns", () => {
  const actual = jest.requireActual("date-fns");
  return {
    ...actual,
    isToday: jest.fn(),
    isYesterday: jest.fn(),
  };
});

import { isToday, isYesterday } from "date-fns";

const mockIsToday = isToday as jest.MockedFunction<typeof isToday>;
const mockIsYesterday = isYesterday as jest.MockedFunction<typeof isYesterday>;

beforeEach(() => {
  mockIsToday.mockReset();
  mockIsYesterday.mockReset();
});

describe("getDateLabel", () => {
  it('오늘 날짜는 "오늘"을 반환한다', () => {
    mockIsToday.mockReturnValue(true);
    mockIsYesterday.mockReturnValue(false);

    expect(getDateLabel("2025-01-15")).toBe("오늘");
  });

  it('어제 날짜는 "어제"를 반환한다', () => {
    mockIsToday.mockReturnValue(false);
    mockIsYesterday.mockReturnValue(true);

    expect(getDateLabel("2025-01-14")).toBe("어제");
  });

  it("올해 다른 날짜는 M월 d일 형식으로 반환한다", () => {
    mockIsToday.mockReturnValue(false);
    mockIsYesterday.mockReturnValue(false);

    const currentYear = new Date().getFullYear();
    const dateStr = `${currentYear}-03-05`;
    const result = getDateLabel(dateStr);

    expect(result).toBe("3월 5일");
  });

  it("다른 해 날짜는 yyyy년 M월 d일 형식으로 반환한다", () => {
    mockIsToday.mockReturnValue(false);
    mockIsYesterday.mockReturnValue(false);

    expect(getDateLabel("2020-07-20")).toBe("2020년 7월 20일");
  });
});

describe("groupByDate", () => {
  beforeEach(() => {
    mockIsToday.mockReturnValue(false);
    mockIsYesterday.mockReturnValue(false);
  });

  it("같은 날짜의 아이템들이 같은 그룹으로 묶인다", () => {
    const items = [
      { id: 1, date: "2020-06-10T10:00:00" },
      { id: 2, date: "2020-06-10T15:00:00" },
    ];

    const result = groupByDate(items);

    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(2);
    expect(result[0].items[0].id).toBe(1);
    expect(result[0].items[1].id).toBe(2);
  });

  it("다른 날짜의 아이템들이 다른 그룹으로 분리된다", () => {
    const items = [
      { id: 1, date: "2020-06-10T10:00:00" },
      { id: 2, date: "2020-06-11T10:00:00" },
    ];

    const result = groupByDate(items);

    expect(result).toHaveLength(2);
    expect(result[0].items[0].id).toBe(1);
    expect(result[1].items[0].id).toBe(2);
  });

  it("빈 배열은 빈 그룹 배열을 반환한다", () => {
    const result = groupByDate([]);

    expect(result).toEqual([]);
  });

  it("dateKey가 YYYY-MM-DD 형식이다", () => {
    const items = [{ id: 1, date: "2020-06-10T10:00:00" }];

    const result = groupByDate(items);

    expect(result[0].dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result[0].dateKey).toBe("2020-06-10");
  });
});
