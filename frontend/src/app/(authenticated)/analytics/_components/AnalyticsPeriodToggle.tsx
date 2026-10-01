"use client";

import { useSearchParams } from "next/navigation";
import { useAppRouter } from "@/lib/client/navigation";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import type { AnalyticsPeriod } from "@/types/analytics";

const PERIOD_OPTIONS = [
  { key: "m1" as const, label: "이번 달" },
  { key: "m3" as const, label: "3개월" },
  { key: "m6" as const, label: "6개월" },
  { key: "y1" as const, label: "1년" },
] as const;

interface AnalyticsPeriodToggleProps {
  period: AnalyticsPeriod;
}

export function AnalyticsPeriodToggle({ period }: AnalyticsPeriodToggleProps) {
  const router = useAppRouter();
  const searchParams = useSearchParams();

  const handleChange = (next: AnalyticsPeriod) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", next);
    router.replace(`?${params.toString()}`);
  };

  return (
    <SegmentedToggle
      options={PERIOD_OPTIONS}
      value={period}
      onChange={handleChange}
      ariaLabel="분석 기간 선택"
    />
  );
}
