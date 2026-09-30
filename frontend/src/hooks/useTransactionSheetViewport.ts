"use client";

import { useCallback, useSyncExternalStore, type CSSProperties } from "react";

export function useTransactionSheetViewport(open: boolean, isDesktop: boolean): CSSProperties | undefined {
  const enabled = open && !isDesktop;
  const subscribe = useCallback((onChange: () => void) => {
    const viewport = window.visualViewport;
    if (!enabled || !viewport) return () => {};

    viewport.addEventListener("resize", onChange);
    viewport.addEventListener("scroll", onChange);
    return () => {
      viewport.removeEventListener("resize", onChange);
      viewport.removeEventListener("scroll", onChange);
    };
  }, [enabled]);

  const getSnapshot = useCallback(() => {
    const viewport = window.visualViewport;
    if (!enabled || !viewport) return "";
    return `${viewport.height}:${viewport.offsetTop}`;
  }, [enabled]);

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "");
  if (!snapshot) return undefined;

  const [height, top] = snapshot.split(":").map(Number);
  return { height, top, bottom: "auto" };
}
