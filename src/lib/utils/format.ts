/**
 * 포맷팅 유틸리티 함수
 */

import { format } from "date-fns";
import { ko } from "date-fns/locale";

/**
 * 금액을 한국 원화 형식으로 포맷팅
 * @param amount - 포맷팅할 금액
 * @returns 포맷팅된 금액 문자열 (예: "₩1,234,567")
 */
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === "string" ? Number(amount) : amount;

  if (Number.isNaN(numAmount)) {
    return "₩0";
  }

  return `₩${numAmount.toLocaleString("ko-KR")}`;
}

/**
 * 날짜를 한국어 형식으로 포맷팅
 * @param date - Date 객체 또는 ISO 문자열
 * @param format - 'short' | 'long' | 'date-only'
 * @returns 포맷팅된 날짜 문자열
 */
export function formatDate(
  date: Date | string,
  format: "short" | "long" | "date-only" = "short"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(dateObj.getTime())) {
    return "잘못된 날짜";
  }

  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Seoul",
  };

  switch (format) {
    case "long":
      return dateObj.toLocaleString("ko-KR", {
        ...options,
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
    case "date-only":
      return dateObj.toLocaleString("ko-KR", {
        ...options,
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    default: // short
      return dateObj.toLocaleString("ko-KR", {
        ...options,
        month: "long",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
  }
}

/**
 * 상대 시간 표시 (예: "3시간 전", "2일 전")
 * @param date - Date 객체 또는 ISO 문자열
 * @returns 상대 시간 문자열
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "방금 전";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  if (diffDays < 7) {
    return `${diffDays}일 전`;
  }

  return formatDate(dateObj, "date-only");
}

/**
 * 지출/수입 아이템용 날짜 포맷팅 (date-fns 사용)
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns 포맷팅된 날짜 문자열 (예: "1월 15일 (수) 10:00")
 */
export function formatExpenseDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return "잘못된 날짜";
    }
    return format(date, "M월 d일 (E) HH:mm", { locale: ko });
  } catch {
    return "잘못된 날짜";
  }
}

/**
 * 카테고리 색상에 알파값 적용
 * @param color - HEX 색상 코드 (예: "#FF6B6B")
 * @param alpha - 0~1 사이의 투명도 값
 * @returns RGBA 색상 문자열
 */
export function applyAlpha(color: string, alpha: number): string {
  // #RRGGBB 형식 검증
  if (!/^#[0-9A-F]{6}$/i.test(color)) {
    return color;
  }

  const r = Number.parseInt(color.slice(1, 3), 16);
  const g = Number.parseInt(color.slice(3, 5), 16);
  const b = Number.parseInt(color.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
