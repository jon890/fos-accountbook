import { format, getYear, isToday, isYesterday, parseISO } from "date-fns";

export function getDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "오늘";
  if (isYesterday(date)) return "어제";
  if (getYear(date) === getYear(new Date())) return format(date, "M월 d일");
  return format(date, "yyyy년 M월 d일");
}

export function groupByDate<T extends { date: string }>(
  items: T[]
): { dateKey: string; label: string; items: T[] }[] {
  const groups: { dateKey: string; label: string; items: T[] }[] = [];
  const seenDates = new Map<string, number>();

  for (const item of items) {
    const dayPart = format(parseISO(item.date), "yyyy-MM-dd");
    if (!seenDates.has(dayPart)) {
      seenDates.set(dayPart, groups.length);
      groups.push({ dateKey: dayPart, label: getDateLabel(dayPart), items: [] });
    }
    const idx = seenDates.get(dayPart);
    if (idx !== undefined) {
      groups[idx].items.push(item);
    }
  }

  return groups;
}
