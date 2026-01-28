"use client";

import {
  getMonthlyDailyStatsAction,
  type DailyTransactionSummary,
} from "@/app/actions/dashboard/get-monthly-daily-stats-action";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/client/utils";
import { addMonths, format } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { DayButtonProps } from "react-day-picker";
import { toast } from "sonner";

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [dailyStats, setDailyStats] = useState<DailyTransactionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 월이 변경될 때마다 데이터 로드
  useEffect(() => {
    let ignore = false;

    const fetchStats = async () => {
      setIsLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      const result = await getMonthlyDailyStatsAction(year, month);

      if (!ignore) {
        if (result.success) {
          setDailyStats(result.data || []);
        } else {
          toast.error("달력 데이터를 불러오는데 실패했습니다.");
        }
        setIsLoading(false);
      }
    };

    fetchStats();

    return () => {
      ignore = true;
    };
  }, [currentMonth]);

  // 특정 날짜의 통계 찾기
  const getStatsForDay = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return dailyStats.find((stat) => stat.date === dateStr);
  };

  // 금액 포맷팅 (단위: 만원, 천원 등 축약하거나 콤마)
  const formatAmount = (amount: number) => {
    if (amount === 0) return "";
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(1)}만`;
    }
    return amount.toLocaleString();
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">
          {format(currentMonth, "yyyy년 M월", { locale: ko })} 가계부
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            disabled={isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            disabled={isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-4">
        <div className="flex justify-center w-full">
          <Calendar
            mode="single"
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-md border w-full max-w-full p-2 sm:p-4"
            classNames={{
              months: "w-full",
              month: "w-full space-y-4",
              caption: "hidden", // 기본 헤더 숨김
              nav: "hidden", // 기본 네비게이션 숨김
              month_grid: "w-full border-collapse", // table
              weekdays: "grid grid-cols-7 mb-2", // head_row
              weekday:
                "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] flex justify-center", // head_cell
              week: "grid grid-cols-7 w-full mt-0", // row
              day: "h-16 sm:h-24 w-full border border-gray-100 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20", // cell
              day_button:
                "h-full w-full p-1 font-normal flex flex-col items-center justify-start hover:bg-gray-50", // day
            }}
            components={{
              DayButton: (props: DayButtonProps) => {
                const { day, ...buttonProps } = props;
                const date = day.date;
                const stats = getStatsForDay(date);
                const isToday =
                  format(new Date(), "yyyy-MM-dd") ===
                  format(date, "yyyy-MM-dd");

                return (
                  <button
                    {...buttonProps}
                    className={cn(
                      buttonProps.className,
                      "h-full w-full p-1 font-normal flex flex-col items-center justify-start hover:bg-gray-50",
                    )}
                  >
                    <div className="flex flex-col items-center w-full h-full gap-1 pt-1">
                      <span
                        className={cn(
                          "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                          isToday && "bg-primary text-primary-foreground",
                        )}
                      >
                        {date.getDate()}
                      </span>

                      {stats && (
                        <div className="flex flex-col items-center gap-0.5 w-full px-1">
                          {stats.income > 0 && (
                            <span className="text-[9px] sm:text-[10px] text-blue-600 font-medium truncate w-full text-center bg-blue-50/50 rounded-sm leading-tight">
                              +{formatAmount(stats.income)}
                            </span>
                          )}
                          {stats.expense > 0 && (
                            <span className="text-[9px] sm:text-[10px] text-red-500 font-medium truncate w-full text-center bg-red-50/50 rounded-sm leading-tight">
                              -{formatAmount(stats.expense)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              },
            }}
          />
        </div>

        {/* 요약 범례 */}
        <div className="flex justify-end gap-4 px-4 pb-4 text-xs text-gray-500 mt-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span>수입</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span>지출</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
