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
