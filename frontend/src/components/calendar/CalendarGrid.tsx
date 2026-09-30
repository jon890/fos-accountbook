import { Button } from "@/components/ui/button";
import { cn } from "@/lib/client/utils";
import { formatCompactAmount } from "@/lib/utils/format";
import { getMemberColor, type MemberColor } from "@/lib/utils/member-color";
import type { DailyStatsWithMembers } from "@/types/dashboard";

interface CalendarGridProps {
  year: number;
  month: number;
  dailyStats: DailyStatsWithMembers["dailyStats"];
  colors: Map<string, MemberColor>;
  selectedDate: string;
  today: string;
  onSelect: (date: string) => void;
}

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarGrid({ year, month, dailyStats, colors, selectedDate, today, onSelect }: CalendarGridProps) {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const days = new Map(dailyStats.map((day) => [day.date, day]));

  return (
    <div>
      <div className="grid grid-cols-7 text-center text-xs text-fg-muted">
        {weekdays.map((weekday, index) => (
          <span key={weekday} className={cn("py-2", index === 0 && "text-expense", index === 6 && "text-brand-500")}>{weekday}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: cellCount }, (_, index) => {
          const day = index - firstWeekday + 1;
          if (day < 1 || day > daysInMonth) {
            return <div key={index} aria-hidden="true" />;
          }
          const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const expenses = [...(days.get(date)?.memberExpenses ?? [])].sort((left, right) => right.amount - left.amount);
          const memberLabels = expenses.map((expense) => `${getMemberColor(colors, expense.userUuid).label} ${expense.amount.toLocaleString("ko-KR")}원`);
          const label = [`${month}월 ${day}일`, ...memberLabels].join(", ");
          const weekday = index % 7;

          return (
            <Button
              key={date}
              variant="ghost"
              aria-label={label}
              aria-pressed={selectedDate === date}
              onClick={() => onSelect(date)}
              className={cn("h-auto min-h-[80px] min-w-0 flex-col justify-start gap-1 rounded-lg px-0.5 py-1.5 hover:bg-bg-muted", selectedDate === date && "bg-brand-500/15 hover:bg-brand-500/20")}
            >
              <span className={cn("num flex size-6 shrink-0 items-center justify-center rounded-full text-xs", weekday === 0 && "text-expense", weekday === 6 && "text-brand-500", today === date && "border border-brand-500")}>
                {day}
              </span>
              <span className="w-full space-y-0.5">
                {expenses.slice(0, 2).map((expense) => {
                  const member = getMemberColor(colors, expense.userUuid);
                  return (
                    <span key={expense.userUuid} className="flex items-center justify-center gap-0.5 text-[11px] leading-3.5">
                      <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${member.bgClass}`} />
                      <span className="num tabular-nums text-fg">{formatCompactAmount(expense.amount)}</span>
                    </span>
                  );
                })}
                {expenses.length > 2 && <span className="num block text-center text-[11px] leading-3.5 text-fg-muted">+{expenses.length - 2}</span>}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
