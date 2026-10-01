"use client";

import { setDefaultFamilyAction } from "@/actions/user/set-default-family-action";
import { useSessionRefresh } from "@/lib/client/use-session-refresh";
import type { Family } from "@/types/family";
import { useAppRouter } from "@/lib/client/navigation";
import { FamilySelector } from "./FamilySelector";
import { useTransition } from "react";
import { toast } from "sonner";

/**
 * 가족 선택 페이지 (Client Component)
 * FamilySelector가 직접 가족 목록을 페칭하므로 별도 prop이 필요 없음
 */
export function FamilySelectorPage() {
  const router = useAppRouter();
  const { refreshSession } = useSessionRefresh();
  const [isActionPending, startActionTransition] = useTransition();
  const isPending = isActionPending || router.isPending;

  const handleFamilySelect = (family: Family) => {
    startActionTransition(async () => {
      try {
        const result = await setDefaultFamilyAction(family.uuid);

        if (!result.success) {
          toast.error("가족 선택에 실패했습니다.");
          return;
        }

        await refreshSession();
        router.push("/calendar");
      } catch {
        toast.error("가족 선택에 실패했습니다.");
      }
    });
  };

  const handleCreateFamily = () => {
    startActionTransition(() => {
      router.push("/families/create");
    });
  };

  return (
    <FamilySelector
      onFamilySelect={handleFamilySelect}
      onCreateFamily={handleCreateFamily}
      isPending={isPending}
    />
  );
}
