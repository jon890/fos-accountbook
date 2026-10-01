import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthHeaderProps {
  year: number;
  month: number;
  onMove: (direction: -1 | 1) => void;
  isNavigationPending: boolean;
}

export function MonthHeader({
  year,
  month,
  onMove,
  isNavigationPending,
}: MonthHeaderProps) {
  const isFirstMonth = year === 2000 && month === 1;
  const isLastMonth = year === 2100 && month === 12;

  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        className="size-11"
        aria-label="이전 달"
        disabled={isNavigationPending || isFirstMonth}
        onClick={() => onMove(-1)}
      >
        <ChevronLeft className="size-5" />
      </Button>
      <h1 className="text-xl font-bold text-fg"><span className="num">{year}</span>년 <span className="num">{month}</span>월</h1>
      <Button
        variant="ghost"
        className="size-11"
        aria-label="다음 달"
        disabled={isNavigationPending || isLastMonth}
        onClick={() => onMove(1)}
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}
