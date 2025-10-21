"use client";

import { setDefaultFamily } from "@/app/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Family } from "@/types/actions";
import { Check, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface SettingsPageClientProps {
  families: Family[];
}

export function SettingsPageClient({ families }: SettingsPageClientProps) {
  const router = useRouter();
  const [selectedFamily, setSelectedFamily] = useState<string>("");
  const [currentDefaultFamily, setCurrentDefaultFamily] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveDefaultFamily = async () => {
    if (!selectedFamily) {
      toast.error("기본 가족을 선택해주세요");
      return;
    }

    try {
      setIsSaving(true);
      await setDefaultFamily(selectedFamily);
      setCurrentDefaultFamily(selectedFamily);
      toast.success("기본 가족이 설정되었습니다");
      router.refresh();
    } catch (error) {
      console.error("Failed to set default family:", error);
      toast.error("기본 가족 설정에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          설정
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          가계부 설정을 관리합니다
        </p>
      </div>

      {/* 기본 가족 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            기본 가족 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            앱 진입 시 기본으로 보여질 가족 가계부를 선택하세요.
          </p>

          <RadioGroup
            value={selectedFamily || currentDefaultFamily}
            onValueChange={setSelectedFamily}
            className="space-y-3"
          >
            {families.map((family) => (
              <div
                key={family.uuid}
                className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RadioGroupItem value={family.uuid} id={family.uuid} />
                <Label
                  htmlFor={family.uuid}
                  className="flex-1 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {family.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      구성원 {family.members?.length || 0}명 · 지출{" "}
                      {family.expenseCount || 0}건
                    </span>
                  </div>
                  {currentDefaultFamily === family.uuid && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <Check className="w-4 h-4" />
                      현재 기본
                    </div>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={handleSaveDefaultFamily}
              disabled={
                isSaving ||
                !selectedFamily ||
                selectedFamily === currentDefaultFamily
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? "저장 중..." : "기본 가족으로 설정"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 가족 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />내 가족 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {families.map((family) => (
              <div
                key={family.uuid}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{family.name}</h3>
                  <p className="text-sm text-gray-500">
                    구성원 {family.members?.length || 0}명 · 카테고리{" "}
                    {family.categories?.length || 0}개 · 지출{" "}
                    {family.expenseCount || 0}건
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/families/${family.uuid}`)}
                >
                  관리
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
