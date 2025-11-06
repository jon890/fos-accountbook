"use client";

import { getFamiliesAction } from "@/app/actions/family/get-families-action";
import { getSelectedFamilyAction } from "@/app/actions/family/get-selected-family-action";
import { selectFamilyAction } from "@/app/actions/family/select-family-action";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Family } from "@/types/actions";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function FamilySelectorDropdown() {
  const router = useRouter();
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // 가족 목록과 선택된 가족을 병렬로 가져오기
      const [familiesResult, selectedFamilyResult] = await Promise.all([
        getFamiliesAction(),
        getSelectedFamilyAction(),
      ]);

      if (familiesResult.success && familiesResult.data) {
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
          await selectFamilyAction(firstFamilyUuid);
        }
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFamilyChange = async (familyUuid: string) => {
    setSelectedFamily(familyUuid);

    // Server Action을 통해 쿠키에 저장
    const result = await selectFamilyAction(familyUuid);

    if (result.success) {
      // 페이지 새로고침하여 선택된 가족의 데이터 표시
      router.refresh();
    } else {
      console.error("Failed to select family:", result.error.message);
      // 실패 시 이전 선택으로 롤백
      loadInitialData();
    }
  };

  if (loading) {
    return (
      <div className="w-32 md:w-40 h-8 md:h-9 bg-gray-100 animate-pulse rounded-md"></div>
    );
  }

  if (families.length === 0) {
    return null;
  }

  return (
    <Select value={selectedFamily} onValueChange={handleFamilyChange}>
      <SelectTrigger className="w-32 md:w-40 h-8 md:h-9 text-xs md:text-sm">
        <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
        <SelectValue placeholder="가족 선택" />
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
