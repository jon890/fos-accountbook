"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/client/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

function formatKorean(amount: number): string {
  if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1)}억`;
  if (amount >= 10_000) return `${Math.round(amount / 10_000)}만`;
  return amount.toLocaleString("ko-KR");
}

function buildLabel(min: string | null, max: string | null): string {
  const minVal = min ? formatKorean(Number(min)) : null;
  const maxVal = max ? formatKorean(Number(max)) : null;
  if (minVal && maxVal) return `${minVal}~${maxVal}`;
  if (minVal) return `${minVal} 이상`;
  if (maxVal) return `${maxVal} 이하`;
  return "금액";
}

const chipBase =
  "flex items-center gap-1 border px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap shrink-0 rounded-full md:rounded-md";
const chipDefault = "border-border bg-bg-elev text-fg-muted hover:text-fg";
const chipActive = "border-brand-300 bg-brand-50 text-brand-700";

export function AmountRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const currentMin = searchParams.get("amountMin");
  const currentMax = searchParams.get("amountMax");
  const hasValue = currentMin !== null || currentMax !== null;

  const [minDraft, setMinDraft] = useState<string | null>(null);
  const [maxDraft, setMaxDraft] = useState<string | null>(null);
  const minInput = minDraft ?? currentMin ?? "";
  const maxInput = maxDraft ?? currentMax ?? "";
  const setMinInput = setMinDraft;
  const setMaxInput = setMaxDraft;

  const apply = () => {
    const params = new URLSearchParams(searchParams.toString());
    const min = Number(minInput);
    const max = Number(maxInput);

    if (minInput && !isNaN(min) && min > 0) {
      params.set("amountMin", String(min));
    } else {
      params.delete("amountMin");
    }
    if (maxInput && !isNaN(max) && max > 0) {
      params.set("amountMax", String(max));
    } else {
      params.delete("amountMax");
    }
    params.set("page", "1");
    router.replace(`/transactions?${params.toString()}`);
    setMinDraft(null);
    setMaxDraft(null);
    setOpen(false);
  };

  const reset = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("amountMin");
    params.delete("amountMax");
    params.set("page", "1");
    router.replace(`/transactions?${params.toString()}`);
    setMinDraft(null);
    setMaxDraft(null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="금액 범위 필터"
          aria-expanded={open}
          className={cn(chipBase, hasValue ? chipActive : chipDefault)}
        >
          {buildLabel(currentMin, currentMax)}
          <ChevronDown size={13} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 space-y-3" align="start">
        <p className="text-sm font-semibold text-fg">금액 범위</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="최솟값"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            className="h-8 text-sm flex-1 min-w-0"
            aria-label="최솟값 금액"
            min={0}
          />
          <span className="text-fg-muted text-xs shrink-0" aria-hidden="true">
            ~
          </span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="최댓값"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            className="h-8 text-sm flex-1 min-w-0"
            aria-label="최댓값 금액"
            min={0}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="flex-1 py-1.5 text-xs rounded-md border border-border text-fg-muted hover:text-fg transition-colors"
          >
            초기화
          </button>
          <button
            onClick={apply}
            className="flex-1 py-1.5 text-xs rounded-md bg-fg text-bg font-semibold hover:opacity-90 transition-opacity"
          >
            적용
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
