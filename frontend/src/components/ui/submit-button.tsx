/**
 * Form 제출 버튼 컴포넌트
 * useFormStatus를 사용하여 자동으로 제출 중 상태를 관리합니다.
 */

"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useFormStatus } from "react-dom";

interface SubmitButtonProps
  extends Omit<React.ComponentProps<"button">, "type">,
    VariantProps<typeof buttonVariants> {
  pendingText?: string;
  asChild?: boolean;
}

export function SubmitButton({
  children,
  pendingText,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {pendingText || "처리 중..."}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
