"use client";

import { getFamilies } from "@/app/actions/family-actions";
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

const SELECTED_FAMILY_KEY = "selected_family_uuid";

export function FamilySelectorDropdown() {
  const router = useRouter();
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      const result = await getFamilies();

      if (result.success && result.data) {
        setFamilies(result.data);

        // localStorage에서 선택된 가족 가져오기
        const savedFamily = localStorage.getItem(SELECTED_FAMILY_KEY);

        if (savedFamily && result.data.some((f) => f.uuid === savedFamily)) {
          setSelectedFamily(savedFamily);
        } else if (result.data.length > 0) {
          // 저장된 가족이 없거나 유효하지 않으면 첫 번째 가족 선택
          const firstFamily = result.data[0].uuid;
          setSelectedFamily(firstFamily);
          localStorage.setItem(SELECTED_FAMILY_KEY, firstFamily);
        }
      }
    } catch (err) {
      console.error("Failed to fetch families:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFamilyChange = (familyUuid: string) => {
    setSelectedFamily(familyUuid);
    // localStorage에 저장
    localStorage.setItem(SELECTED_FAMILY_KEY, familyUuid);
    // 페이지 새로고침하여 선택된 가족의 데이터 표시
    router.refresh();
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
