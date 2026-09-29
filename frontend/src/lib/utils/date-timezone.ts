/**
 * 시간대 기반 날짜 유틸리티
 */

import { format, startOfMonth, endOfMonth, subMonths, subYears, parseISO } from "date-fns";

/**
 * 주어진 시간대에서 현재 날짜를 기준으로 해당 월의 첫날과 마지막날을 반환
 */
export function getMonthRange(timezone: string): {
  startDate: string;
  endDate: string;
} {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
    });

    const parts = formatter.formatToParts(now);
    const yearValue = parts.find((p) => p.type === "year")?.value;
    const monthValue = parts.find((p) => p.type === "month")?.value;
    if (!yearValue || !monthValue) throw new Error("Invalid date parts");
    const year = parseInt(yearValue);
    const month = parseInt(monthValue);

    const firstOfMonth = new Date(year, month - 1, 1);
    return {
      startDate: format(startOfMonth(firstOfMonth), "yyyy-MM-dd"),
      endDate: format(endOfMonth(firstOfMonth), "yyyy-MM-dd"),
    };
  } catch {
    return getMonthRangeFromBrowser();
  }
}

/**
 * 브라우저 시간대 기준으로 현재 월의 첫날과 마지막날 반환
 */
function getMonthRangeFromBrowser(): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  return {
    startDate: format(startOfMonth(now), "yyyy-MM-dd"),
    endDate: format(endOfMonth(now), "yyyy-MM-dd"),
  };
}

/**
 * 시간대가 유효한지 검증
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * 브라우저의 시간대 가져오기
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "Asia/Seoul"; // 최종 폴백
  }
}

/**
 * 시간대 기준 현재 날짜 가져오기 (YYYY-MM-DD)
 */
function getTodayInTimezone(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(now); // YYYY-MM-DD
  } catch {
    return format(new Date(), "yyyy-MM-dd");
  }
}

/**
 * 최근 N개월 범위 반환
 */
export function getLastNMonthsRange(
  timezone: string,
  months: number
): {
  startDate: string;
  endDate: string;
} {
  try {
    const endDate = getTodayInTimezone(timezone);
    const startDate = format(subMonths(parseISO(endDate), months), "yyyy-MM-dd");
    return { startDate, endDate };
  } catch {
    const now = new Date();
    return {
      startDate: format(subMonths(now, months), "yyyy-MM-dd"),
      endDate: format(now, "yyyy-MM-dd"),
    };
  }
}

/**
 * 최근 1년 범위 반환
 */
export function getLastYearRange(timezone: string): {
  startDate: string;
  endDate: string;
} {
  try {
    const endDate = getTodayInTimezone(timezone);
    const startDate = format(subYears(parseISO(endDate), 1), "yyyy-MM-dd");
    return { startDate, endDate };
  } catch {
    const now = new Date();
    return {
      startDate: format(subYears(now, 1), "yyyy-MM-dd"),
      endDate: format(now, "yyyy-MM-dd"),
    };
  }
}
