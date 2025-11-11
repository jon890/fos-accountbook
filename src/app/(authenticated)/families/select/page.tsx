/**
 * Family Select Page - Server Component
 * 가족 선택 페이지
 *
 * 역할:
 * - 사용자가 속한 가족 목록 표시
 * - 가족 선택 UI 제공
 * - 가족이 없으면 생성 페이지로 리다이렉트
 */

import { getFamiliesAction } from "@/app/actions/family/get-families-action";
import { FamilySelectorPage } from "@/components/families/FamilySelectorPage";
import { redirect } from "next/navigation";

// 동적 렌더링 (최신 가족 목록)
export const dynamic = "force-dynamic";

export default async function FamilySelectPage() {
  // 1. 가족 목록 조회
  const familiesResult = await getFamiliesAction();

  // 2. 가족이 없으면 생성 페이지로
  if (!familiesResult.success || familiesResult.data.length === 0) {
    redirect("/families/create");
  }

  // 3. 가족 선택 UI 렌더링
  return <FamilySelectorPage families={familiesResult.data} />;
}
