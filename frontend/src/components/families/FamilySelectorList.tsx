"use client";

import { selectFamilyAction } from "@/actions/family/select-family-action";
import { useSessionRefresh } from "@/lib/client/use-session-refresh";
import type { Family } from "@/types/family";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  const router = useRouter();
  const { refreshSession } = useSessionRefresh();

  const handleSelect = async (familyUuid: string) => {
    const result = await selectFamilyAction(familyUuid);
    if (result.success) {
      await refreshSession();
      router.refresh();
      onSelected?.(familyUuid);
    } else {
      toast.error("가족 전환에 실패했습니다.");
    }
  };

  return (
    <ul className="flex flex-col gap-1 py-2">
      {families.map((family) => (
        <li key={family.uuid}>
          <button
            type="button"
            onClick={() => handleSelect(family.uuid)}
            className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors ${
              family.uuid === selectedFamilyUuid
                ? "bg-brand-50 text-brand-700 font-medium"
                : "text-fg hover:bg-bg-muted"
            }`}
          >
            {family.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
