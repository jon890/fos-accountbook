"use client";

import { setDefaultFamilyAction } from "@/app/actions/user/set-default-family-action";
import type { Family } from "@/types/family";
import { useRouter } from "next/navigation";
import { FamilySelector } from "./FamilySelector";

interface FamilySelectorPageProps {
  families: Family[];
}

/**
 * 가족 선택 페이지 (Client Component)
 * Server Component에서 families를 받아서 FamilySelector를 렌더링
 */
export function FamilySelectorPage({ families }: FamilySelectorPageProps) {
  const router = useRouter();

  const handleFamilySelect = async (family: Family) => {
    // 선택한 가족을 기본 가족으로 설정
    const result = await setDefaultFamilyAction(family.uuid);

    if (result.success) {
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
