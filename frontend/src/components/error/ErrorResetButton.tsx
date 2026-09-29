"use client";

interface ErrorResetButtonProps {
  reset: () => void;
  label?: string;
}

export function ErrorResetButton({
  reset,
  label = "다시 시도",
}: ErrorResetButtonProps) {
  return (
    <button
      type="button"
      onClick={reset}
      className="h-12 px-6 rounded-xl bg-brand-500 text-brand-fg font-semibold hover:opacity-90 transition-opacity"
    >
      {label}
    </button>
  );
}
