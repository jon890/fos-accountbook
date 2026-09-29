"use client";

import { useSession } from "next-auth/react";
import { useCallback } from "react";

/**
 * 세션 갱신 훅
 *
 * 프로필 변경 후 세션을 갱신해야 할 때 사용합니다.
 * NextAuth의 update()를 호출하면 jwt callback(trigger="update")이 실행되어
 * 백엔드에서 최신 프로필을 다시 조회합니다.
 *
 * @example
 * ```tsx
 * const { refreshSession } = useSessionRefresh();
 *
 * const handleUpdateProfile = async () => {
 *   await updateProfileAction(...);
 *   await refreshSession(); // 세션 갱신
 * };
 * ```
 */
export function useSessionRefresh() {
  const { update } = useSession();

  const refreshSession = useCallback(async () => {
    // update()를 호출하면 jwt callback(trigger="update")이 실행됨
    await update();
  }, [update]);

  return { refreshSession };
}
