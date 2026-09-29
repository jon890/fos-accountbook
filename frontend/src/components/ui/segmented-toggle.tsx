"use client";

import { cn } from "@/lib/client/utils";

interface SegmentedToggleProps<T extends string> {
  options: ReadonlyArray<{ key: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  disabled,
  ariaLabel,
}: SegmentedToggleProps<T>) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const idx = options.findIndex((opt) => opt.key === value);
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const next = idx > 0 ? options[idx - 1].key : options[options.length - 1].key;
      onChange(next);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      const next = idx < options.length - 1 ? options[idx + 1].key : options[0].key;
      onChange(next);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex gap-1 bg-bg-muted p-1 rounded-xl"
    >
      {options.map((opt) => {
        const isActive = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(opt.key)}
            onKeyDown={handleKeyDown}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isActive
                ? "bg-bg-elev text-fg shadow-[var(--shadow-subtle)]"
                : "text-fg-muted hover:text-fg",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
