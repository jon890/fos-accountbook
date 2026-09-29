"use client";

import { setDefaultFamilyAction } from "@/actions/user/set-default-family-action";
import { useSessionRefresh } from "@/lib/client/use-session-refresh";
import type { Family } from "@/types/family";
import { useRouter } from "next/navigation";
import { FamilySelector } from "./FamilySelector";

/**
 * 가족 선택 페이지 (Client Component)
 * FamilySelector가 직접 가족 목록을 페칭하므로 별도 prop이 필요 없음
 */
export function FamilySelectorPage() {
  const router = useRouter();
  const { refreshSession } = useSessionRefresh();

  const handleFamilySelect = async (family: Family) => {
    // 선택한 가족을 기본 가족으로 설정
    const result = await setDefaultFamilyAction(family.uuid);

    if (result.success) {
      // 세션 갱신 (프로필의 defaultFamilyUuid가 변경됨)
      await refreshSession();
      // 기본 가족 설정 완료 → 대시보드로 이동
      router.push("/dashboard");
    }
  };

  const handleCreateFamily = () => {
    router.push("/families/create");
  };

  return (
    <FamilySelector
      onFamilySelect={handleFamilySelect}
      onCreateFamily={handleCreateFamily}
    />
  );
}
