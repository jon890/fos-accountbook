"use client";

import { Button } from "@/components/ui/button";

interface AmountKeypadProps {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}

const MAX_DIGITS = 12;

const keys = [
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
  { label: "6", value: "6" },
  { label: "7", value: "7" },
  { label: "8", value: "8" },
  { label: "9", value: "9" },
  { label: "영영", value: "00" },
  { label: "0", value: "0" },
] as const;

function appendDigits(value: number, digits: string): number {
  const current = String(value);
  const next = value === 0 ? digits.replace(/^0+/, "") : `${current}${digits}`;

  if (next === "" || next.length > MAX_DIGITS) {
    return value;
  }

  return Number(next);
}

export function AmountKeypad({ value, onChange, disabled }: AmountKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-2" aria-label="금액 숫자패드">
      {keys.map((key) => (
        <Button
          key={key.value}
          type="button"
          variant="outline"
          className="min-h-12 text-lg num"
          disabled={disabled}
          aria-label={key.label}
          onClick={() => onChange(appendDigits(value, key.value))}
        >
          {key.value}
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        className="min-h-12 text-lg"
        disabled={disabled}
        aria-label="지우기"
        onClick={() => onChange(Math.floor(value / 10))}
      >
        지우기
      </Button>
    </div>
  );
}
