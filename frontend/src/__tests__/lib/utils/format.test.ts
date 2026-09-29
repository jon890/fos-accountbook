/**
 * Format 유틸리티 함수 테스트
 *
 * Unit Test의 좋은 예제:
 * - 순수 함수 테스트
 * - 다양한 입력값 검증
 * - 엣지 케이스 처리
 * - 빠른 실행 속도
 */

import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  applyAlpha,
} from "@/lib/utils/format";

describe("formatCurrency", () => {
  it("숫자를 한국 원화 형식으로 변환한다", () => {
    expect(formatCurrency(1234567)).toBe("₩1,234,567");
  });

  it("문자열 숫자를 변환한다", () => {
    expect(formatCurrency("50000")).toBe("₩50,000");
  });

  it("0을 처리한다", () => {
    expect(formatCurrency(0)).toBe("₩0");
  });

  it("음수를 처리한다", () => {
    expect(formatCurrency(-5000)).toBe("₩-5,000");
  });

  it("잘못된 입력값은 ₩0으로 표시한다", () => {
    expect(formatCurrency("abc")).toBe("₩0");
    expect(formatCurrency(NaN)).toBe("₩0");
  });

  it("소수점을 포함한 금액을 처리한다", () => {
    expect(formatCurrency(1234.56)).toBe("₩1,234.56");
  });
});

describe("formatDate", () => {
  it("short 형식으로 날짜를 포맷팅한다", () => {
    const date = new Date("2025-01-15T14:30:00+09:00");
    const result = formatDate(date, "short");

    expect(result).toContain("1월");
    expect(result).toContain("15일");
  });

  it("long 형식으로 날짜를 포맷팅한다", () => {
    const date = new Date("2025-01-15T14:30:00+09:00");
    const result = formatDate(date, "long");

    expect(result).toContain("2025년");
    expect(result).toContain("1월");
    expect(result).toContain("15일");
  });

  it("date-only 형식으로 날짜만 포맷팅한다", () => {
    const date = new Date("2025-01-15T14:30:00+09:00");
    const result = formatDate(date, "date-only");

    expect(result).toContain("2025년");
    expect(result).toContain("1월");
    expect(result).toContain("15일");
    // 시간은 포함되지 않음
    expect(result).not.toContain(":");
  });

  it("ISO 문자열을 처리한다", () => {
    const result = formatDate("2025-01-15T14:30:00+09:00", "date-only");

    expect(result).toContain("2025년");
    expect(result).toContain("1월");
    expect(result).toContain("15일");
  });

  it("잘못된 날짜는 에러 메시지를 반환한다", () => {
    expect(formatDate("invalid-date")).toBe("잘못된 날짜");
    expect(formatDate(new Date("invalid"))).toBe("잘못된 날짜");
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    // 현재 시간을 고정
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-15T14:30:00+09:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('60초 미만은 "방금 전"으로 표시한다', () => {
    const date = new Date("2025-01-15T14:29:30+09:00"); // 30초 전
    expect(formatRelativeTime(date)).toBe("방금 전");
  });

  it('60분 미만은 "N분 전"으로 표시한다', () => {
    const date = new Date("2025-01-15T14:00:00+09:00"); // 30분 전
    expect(formatRelativeTime(date)).toBe("30분 전");
  });

  it('24시간 미만은 "N시간 전"으로 표시한다', () => {
    const date = new Date("2025-01-15T11:30:00+09:00"); // 3시간 전
    expect(formatRelativeTime(date)).toBe("3시간 전");
  });

  it('7일 미만은 "N일 전"으로 표시한다', () => {
    const date = new Date("2025-01-13T14:30:00+09:00"); // 2일 전
    expect(formatRelativeTime(date)).toBe("2일 전");
  });

  it("7일 이상은 날짜로 표시한다", () => {
    const date = new Date("2025-01-01T14:30:00+09:00"); // 14일 전
    const result = formatRelativeTime(date);

    expect(result).toContain("2025년");
    expect(result).toContain("1월");
    expect(result).toContain("1일");
  });

  it("ISO 문자열을 처리한다", () => {
    const date = "2025-01-15T14:00:00+09:00"; // 30분 전
    expect(formatRelativeTime(date)).toBe("30분 전");
  });
});

describe("applyAlpha", () => {
  it("HEX 색상에 알파값을 적용한다", () => {
    expect(applyAlpha("#FF6B6B", 0.5)).toBe("rgba(255, 107, 107, 0.5)");
  });

  it("알파값 0을 처리한다", () => {
    expect(applyAlpha("#000000", 0)).toBe("rgba(0, 0, 0, 0)");
  });

  it("알파값 1을 처리한다", () => {
    expect(applyAlpha("#FFFFFF", 1)).toBe("rgba(255, 255, 255, 1)");
  });

  it("소문자 HEX를 처리한다", () => {
    expect(applyAlpha("#ff6b6b", 0.3)).toBe("rgba(255, 107, 107, 0.3)");
  });

  it("잘못된 HEX 형식은 원본을 반환한다", () => {
    expect(applyAlpha("#FFF", 0.5)).toBe("#FFF"); // 3자리
    expect(applyAlpha("FF6B6B", 0.5)).toBe("FF6B6B"); // # 없음
    expect(applyAlpha("#GGGGGG", 0.5)).toBe("#GGGGGG"); // 잘못된 문자
    expect(applyAlpha("invalid", 0.5)).toBe("invalid");
  });

  it("다양한 색상을 처리한다", () => {
    expect(applyAlpha("#FF0000", 0.8)).toBe("rgba(255, 0, 0, 0.8)"); // 빨강
    expect(applyAlpha("#00FF00", 0.6)).toBe("rgba(0, 255, 0, 0.6)"); // 초록
    expect(applyAlpha("#0000FF", 0.4)).toBe("rgba(0, 0, 255, 0.4)"); // 파랑
  });
});
