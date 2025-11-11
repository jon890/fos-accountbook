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
    await setDefaultFamilyAction(family.uuid);

    // 홈페이지로 리다이렉트 (새로고침하여 대시보드 렌더링)
    window.location.href = "/";
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
