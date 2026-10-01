"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

interface NavigationProgressContextValue {
  pendingCount: number;
  start: () => () => void;
}

const NavigationProgressContext =
  createContext<NavigationProgressContextValue | null>(null);

export function NavigationProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pendingCount, setPendingCount] = useState(0);

  const start = useCallback(() => {
    let finished = false;

    setPendingCount((count) => count + 1);

    return () => {
      if (finished) {
        return;
      }

      finished = true;
      setPendingCount((count) => Math.max(0, count - 1));
    };
  }, []);

  const value = useMemo(
    () => ({ pendingCount, start }),
    [pendingCount, start],
  );

  return (
    <NavigationProgressContext.Provider value={value}>
      {children}
    </NavigationProgressContext.Provider>
  );
}

export function useNavigationProgress() {
  return useContext(NavigationProgressContext)?.pendingCount ?? 0;
}

export function useNavigationPending() {
  return useNavigationProgress() > 0;
}

export function useAppRouter() {
  const router = useRouter();
  const progress = useContext(NavigationProgressContext);
  const startProgress = progress?.start;
  const [isPending, startTransition] = useTransition();
  const finishPendingTransition = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isPending) {
      finishPendingTransition.current?.();
      finishPendingTransition.current = null;
      return;
    }

    if (!startProgress) {
      return;
    }

    const finish = startProgress();
    finishPendingTransition.current = finish;

    return () => {
      finish();

      if (finishPendingTransition.current === finish) {
        finishPendingTransition.current = null;
      }
    };
  }, [isPending, startProgress]);

  return {
    ...router,
    isPending,
    push: (href: string, options?: Parameters<typeof router.push>[1]) => {
      startTransition(() => {
        router.push(href, options);
      });
    },
    replace: (href: string, options?: Parameters<typeof router.replace>[1]) => {
      startTransition(() => {
        router.replace(href, options);
      });
    },
    refresh: () => {
      startTransition(() => {
        router.refresh();
      });
    },
  };
}
