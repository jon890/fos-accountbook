"use client";

import { getFamilies, selectFamily } from "@/app/actions/family-actions";
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

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      const result = await getFamilies();

      if (result.success && result.data) {
        setFamilies(result.data);

        // 첫 번째 가족을 기본 선택으로 표시 (서버에서 쿠키로 관리됨)
        if (result.data.length > 0 && !selectedFamily) {
          setSelectedFamily(result.data[0].uuid);
        }
      }
    } catch (err) {
      console.error("Failed to fetch families:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFamilyChange = async (familyUuid: string) => {
    setSelectedFamily(familyUuid);

    // Server Action을 통해 쿠키에 저장
    const result = await selectFamily(familyUuid);

    if (result.success) {
      // 페이지 새로고침하여 선택된 가족의 데이터 표시
      router.refresh();
    } else {
      console.error("Failed to select family:", result.message);
      // 실패 시 이전 선택으로 롤백
      fetchFamilies();
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
