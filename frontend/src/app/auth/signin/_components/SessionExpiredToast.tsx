"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface SessionExpiredToastProps {
  error?: "auth";
}

/**
 * 세션 만료(error=auth)로 로그인 페이지에 도달했을 때 1회 토스트 고지.
 * 인라인 배너(상시)와 별개로 즉시 인지를 돕는다 (ADR-F26).
 */
export function SessionExpiredToast({ error }: SessionExpiredToastProps) {
  const shown = useRef(false);
  useEffect(() => {
    if (error === "auth" && !shown.current) {
      shown.current = true;
      toast.error("세션이 만료되어 다시 로그인이 필요해요");
    }
  }, [error]);
  return null;
}
