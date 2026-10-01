"use client";

import { selectFamilyAction } from "@/actions/family/select-family-action";
import { useSessionRefresh } from "@/lib/client/use-session-refresh";
import type { Family } from "@/types/family";
import { useAppRouter } from "@/lib/client/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

interface FamilySelectorListProps {
  families: Family[];
  selectedFamilyUuid: string;
  /** select 성공 후 호출자에게 알림 — Sheet close 등 후속 UI 정리용 */
  onSelected?: (familyUuid: string) => void;
}

export function FamilySelectorList({
  families,
  selectedFamilyUuid,
  onSelected,
}: FamilySelectorListProps) {
  const router = useAppRouter();
  const { refreshSession } = useSessionRefresh();
  const [isSelecting, startSelectTransition] = useTransition();
  const isPending = isSelecting || router.isPending;
  // 누른 가족만 진행 표시를 하고, 나머지 행은 이름을 그대로 둔 채 비활성으로만 둔다.
  const [pendingFamilyUuid, setPendingFamilyUuid] = useState<string | null>(null);

  const handleSelect = (familyUuid: string) => {
    setPendingFamilyUuid(familyUuid);
    startSelectTransition(async () => {
      try {
        const result = await selectFamilyAction(familyUuid);
        if (!result.success) {
          toast.error("가족 전환에 실패했습니다.");
          return;
        }

        await refreshSession();
        startSelectTransition(() => {
          router.refresh();
          onSelected?.(familyUuid);
        });
      } catch {
        toast.error("가족 전환에 실패했습니다.");
      }
    });
  };

  return (
    <ul className="flex flex-col gap-1 py-2">
      {families.map((family) => (
        <li key={family.uuid}>
          <button
            type="button"
            onClick={() => handleSelect(family.uuid)}
            disabled={isPending}
            className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors ${
              family.uuid === selectedFamilyUuid
                ? "bg-brand-50 text-brand-700 font-medium"
                : "text-fg hover:bg-bg-muted"
            }`}
          >
            {isPending && pendingFamilyUuid === family.uuid ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> 전환 중...
              </span>
            ) : family.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
