"use client";

import { useRef } from "react";
import { cn } from "@/lib/client/utils";

interface AmountInputProps {
  id?: string;
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}

const MOBILE_CHIPS = [1000, 5000, 10000] as const;
const DESKTOP_ONLY_CHIP = 50000;

export function AmountInput({ id, value, onChange, disabled }: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChipClick = (delta: number) => {
    onChange(Math.max(0, value + delta));
  };

  const handleDisplayClick = () => {
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseInt(raw, 10);
    onChange(Math.max(0, isNaN(parsed) ? 0 : parsed));
  };

  const displayValue = value.toLocaleString("ko-KR");

  return (
    <div className="space-y-3">
      {/* 라벨 */}
      <p className="text-[12px] text-[var(--color-fg-muted)]">얼마를 썼나요?</p>

      {/* 금액 디스플레이 영역 */}
      <div
        className="flex items-baseline gap-1 cursor-text"
        onClick={handleDisplayClick}
      >
        {/* ₩ prefix */}
        <span className="text-[28px] md:text-[32px] font-bold text-[var(--color-fg-muted)] leading-none">
          ₩
        </span>

        {/* 금액 표시 */}
        <span
          className={cn(
            "num",
            "text-[56px] md:text-[64px] font-bold leading-none",
            "overflow-hidden text-ellipsis whitespace-nowrap max-w-[280px] md:max-w-[360px]",
            "[letter-spacing:-0.035em]"
          )}
          aria-live="polite"
          aria-label={`금액 ${displayValue}원`}
        >
          {displayValue}
        </span>

        {/* 직접 입력 hidden input */}
        <input
          id={id}
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={value === 0 ? "" : value}
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
          aria-label="금액 직접 입력"
          min={0}
        />
      </div>

      {/* 빠른 추가 칩 row */}
      <div className="flex gap-2">
        {MOBILE_CHIPS.map((delta) => (
          <button
            key={delta}
            type="button"
            onClick={() => handleChipClick(delta)}
            disabled={disabled}
            className={cn(
              "inline-flex items-center justify-center",
              "rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elev)]",
              "px-3 py-1.5 text-sm font-medium text-[var(--color-fg)]",
              "transition-transform active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            +{delta.toLocaleString("ko-KR")}
          </button>
        ))}

        {/* 데스크톱 전용 칩 (+50,000) */}
        <button
          type="button"
          onClick={() => handleChipClick(DESKTOP_ONLY_CHIP)}
          disabled={disabled}
          className={cn(
            "hidden md:inline-flex items-center justify-center",
            "rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elev)]",
            "px-3 py-1.5 text-sm font-medium text-[var(--color-fg)]",
            "transition-transform active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          +{DESKTOP_ONLY_CHIP.toLocaleString("ko-KR")}
        </button>
      </div>
    </div>
  );
}
