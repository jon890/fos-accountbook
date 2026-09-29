import { format, getYear, isToday, isYesterday, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

export function formatDateHeader(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "오늘";
  if (isYesterday(date)) return "어제";
  if (getYear(date) === getYear(new Date())) {
    return format(date, "M월 d일 (eee)", { locale: ko });
  }
  return format(date, "yyyy년 M월 d일 (eee)", { locale: ko });
}
