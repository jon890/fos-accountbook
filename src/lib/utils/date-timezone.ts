/**
 * 시간대 기반 날짜 유틸리티
 */

/**
 * 주어진 시간대에서 현재 날짜를 기준으로 해당 월의 첫날과 마지막날을 반환
 */
export function getMonthRange(timezone: string): {
  startDate: string;
  endDate: string;
} {
  try {
    // 시간대 기준 현재 날짜 가져오기
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    // YYYY-MM-DD 형식으로 현재 날짜 파싱
    const parts = formatter.formatToParts(now);
    const year = parts.find((p) => p.type === "year")?.value || "";
    const month = parts.find((p) => p.type === "month")?.value || "";

    // 해당 월의 첫날
    const startDate = `${year}-${month}-01`;

    // 해당 월의 마지막날 계산
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    const endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;

    return { startDate, endDate };
  } catch (error) {
    console.error("시간대 파싱 실패, 브라우저 시간대 사용:", error);
    // 파싱 실패 시 브라우저 시간대로 폴백
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
  const year = now.getFullYear();
  const month = now.getMonth();

  const startDate = new Date(year, month, 1).toISOString().split("T")[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

  return { startDate, endDate };
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
  } catch (error) {
    // 폴백: 브라우저 시간대
    return new Date().toISOString().split("T")[0];
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

    // endDate를 파싱하여 months만큼 이전 날짜 계산
    const [year, month, day] = endDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    // months만큼 빼기
    date.setMonth(date.getMonth() - months);

    const startYear = date.getFullYear();
    const startMonth = String(date.getMonth() + 1).padStart(2, "0");
    const startDay = String(date.getDate()).padStart(2, "0");
    const startDate = `${startYear}-${startMonth}-${startDay}`;

    return { startDate, endDate };
  } catch (error) {
    console.error("최근 N개월 계산 실패:", error);
    // 폴백
    const endDate = new Date().toISOString().split("T")[0];
    const startDateObj = new Date();
    startDateObj.setMonth(startDateObj.getMonth() - months);
    const startDate = startDateObj.toISOString().split("T")[0];
    return { startDate, endDate };
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

    // endDate를 파싱하여 1년 전 날짜 계산
    const [year, month, day] = endDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    // 1년 빼기
    date.setFullYear(date.getFullYear() - 1);

    const startYear = date.getFullYear();
    const startMonth = String(date.getMonth() + 1).padStart(2, "0");
    const startDay = String(date.getDate()).padStart(2, "0");
    const startDate = `${startYear}-${startMonth}-${startDay}`;

    return { startDate, endDate };
  } catch (error) {
    console.error("최근 1년 계산 실패:", error);
    // 폴백
    const endDate = new Date().toISOString().split("T")[0];
    const startDateObj = new Date();
    startDateObj.setFullYear(startDateObj.getFullYear() - 1);
    const startDate = startDateObj.toISOString().split("T")[0];
    return { startDate, endDate };
  }
}
