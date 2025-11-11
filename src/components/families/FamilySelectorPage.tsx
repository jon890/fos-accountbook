"use client";

import { setDefaultFamilyAction } from "@/app/actions/user/set-default-family-action";
import type { Family } from "@/types/actions";
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
      // Server Component를 재실행하여 최신 프로필 정보로 다시 렌더링
      router.refresh();
      // 홈페이지로 SPA 라우팅 (무한루프 방지)
      router.push("/");
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
