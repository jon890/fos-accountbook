"use client";

import { cn } from "@/lib/client/utils";
import type { ButtonHTMLAttributes } from "react";

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  checked: boolean;
}

export function Switch({ checked, className, ...props }: SwitchProps) {
  // 버튼은 44px 터치 영역만 맡고, 보이는 막대와 손잡이는 안쪽 span 이 그린다.
  // 버튼 자체에 바탕색을 주면 44x48 의 둥근 덩어리로 보인다.
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        "group relative flex h-11 w-12 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        data-slot="switch-track"
        className={cn(
          "flex h-6 w-11 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-expense" : "bg-border-strong",
        )}
      >
        <span
          data-slot="switch-thumb"
          className={cn(
            "size-5 rounded-full bg-neutral-0 shadow-subtle transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
    </button>
  );
}
