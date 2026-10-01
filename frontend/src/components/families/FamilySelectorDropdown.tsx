"use client";

import { getFamiliesAction } from "@/actions/family/get-families-action";
import { getSelectedFamilyAction } from "@/actions/family/get-selected-family-action";
import { selectFamilyAction } from "@/actions/family/select-family-action";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSessionRefresh } from "@/lib/client/use-session-refresh";
import type { Family } from "@/types/family";
import { Loader2, Users } from "lucide-react";
import { useAppRouter } from "@/lib/client/navigation";
import { toast } from "sonner";
import { useEffect, useState, useTransition } from "react";

export function FamilySelectorDropdown() {
  const router = useAppRouter();
  const { refreshSession } = useSessionRefresh();
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isSelecting, startSelectTransition] = useTransition();
  const isPending = isSelecting || router.isPending;

  // effect 에서 부르므로 상태는 Promise 콜백 안에서만 바꾼다. loading 의 초기값은 true 다
  const loadInitialData = () =>
    // 가족 목록과 선택된 가족을 병렬로 가져오기
    Promise.all([getFamiliesAction(), getSelectedFamilyAction()])
      .then(async ([familiesResult, selectedFamilyResult]) => {
        if (!familiesResult.success || !familiesResult.data) {
          return;
        }

        setFamilies(familiesResult.data);

        // 쿠키에 저장된 선택된 가족이 있으면 사용
        if (
          selectedFamilyResult.success &&
          selectedFamilyResult.data &&
          familiesResult.data.some((f) => f.uuid === selectedFamilyResult.data)
        ) {
          setSelectedFamily(selectedFamilyResult.data);
        } else if (familiesResult.data.length > 0) {
          // 쿠키에 없거나 유효하지 않으면 첫 번째 가족을 선택하고 쿠키에 저장
          const firstFamilyUuid = familiesResult.data[0].uuid;
          setSelectedFamily(firstFamilyUuid);

          // 쿠키에도 저장 (특히 가족이 1개일 때 중요)
          const result = await selectFamilyAction(firstFamilyUuid);
          if (result.success) {
            await refreshSession();
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load initial data:", err);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFamilyChange = (familyUuid: string) => {
    const previousFamilyUuid = selectedFamily;

    startSelectTransition(async () => {
      setSelectedFamily(familyUuid);

      try {
        // Server Action을 통해 쿠키에 저장
        const result = await selectFamilyAction(familyUuid);
        if (!result.success) {
          setSelectedFamily(previousFamilyUuid);
          toast.error("가족 전환에 실패했습니다.");
          return;
        }

        // 세션 갱신 (프로필의 defaultFamilyUuid가 변경됨)
        await refreshSession();
        // 페이지 새로고침하여 선택된 가족의 데이터 표시
        startSelectTransition(() => {
          router.refresh();
        });
      } catch {
        setSelectedFamily(previousFamilyUuid);
        toast.error("가족 전환에 실패했습니다.");
      }
    });
  };

  if (loading) {
    return (
      <div className="w-32 md:w-40 h-8 md:h-9 bg-bg-muted animate-pulse rounded-md"></div>
    );
  }

  if (families.length === 0) {
    return null;
  }

  return (
    <Select
      value={selectedFamily}
      onValueChange={handleFamilyChange}
      disabled={isPending}
    >
      <SelectTrigger
        className="w-32 md:w-40 h-8 md:h-9 text-xs md:text-sm"
        aria-label={isPending ? "가족 전환 중" : "가족 선택"}
      >
        {isPending ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="size-3 animate-spin md:size-4" />
            전환 중...
          </span>
        ) : (
          <>
            <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <SelectValue placeholder="가족 선택" />
          </>
        )}
      </SelectTrigger>
      <SelectContent>
        {families.map((family) => (
          <SelectItem key={family.uuid} value={family.uuid}>
            {family.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
