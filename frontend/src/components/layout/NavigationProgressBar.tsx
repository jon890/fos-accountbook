"use client";

import { useNavigationProgress } from "@/lib/client/navigation";
import { useEffect, useState } from "react";

const PROGRESS_DELAY_MS = 150;

export function NavigationProgressBar() {
  const pendingCount = useNavigationProgress();
  const isPending = pendingCount > 0;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isPending) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsVisible(true);
    }, PROGRESS_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
      setIsVisible(false);
    };
  }, [isPending]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-[101] h-[3px] overflow-hidden bg-brand-500/20"
      role="progressbar"
      aria-label="화면을 불러오는 중"
    >
      <div className="h-full w-1/3 bg-brand-500 animate-navigation-progress" />
    </div>
  );
}
