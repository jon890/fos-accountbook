"use client";

import { createFamilyAction } from "@/actions/family/create-family-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { useSessionRefresh } from "@/lib/client/use-session-refresh";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const FAMILY_TYPE_OPTIONS = [
  { key: "family", label: "가족" },
  { key: "personal", label: "개인" },
] as const;

type FamilyType = "personal" | "family";

export default function CreateFamilyPage() {
  const [familyName, setFamilyName] = useState("");
  const [familyType, setFamilyType] = useState<FamilyType>("family");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { refreshSession } = useSessionRefresh();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!familyName.trim()) {
      toast.error("가족 이름을 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createFamilyAction({
        name: familyName.trim(),
        description: familyType === "personal" ? "개인 가계부" : undefined,
      });

      if (result.success) {
        await refreshSession();
        toast.success("가족이 성공적으로 생성되었습니다!");
        router.push("/dashboard");
      } else {
        toast.error(result.error.message);
      }
    } catch (error) {
      console.error("Family creation error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "가족 생성 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-md mx-auto pt-20">
        <Card className="bg-bg-elev border-border shadow-default">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto mb-3 w-24 h-24 rounded-full gradient-family flex items-center justify-center">
              <Users className="w-10 h-10 text-brand-fg" strokeWidth={2.2} />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-fg">
              우리집 가계부 시작하기
            </CardTitle>
            <CardDescription className="text-fg-muted">
              새로운 가족을 만들어 가계부를 시작해보세요
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 가족 타입 선택 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">가족 타입</Label>
                <div className="flex justify-center">
                  <SegmentedToggle
                    options={FAMILY_TYPE_OPTIONS}
                    value={familyType}
                    onChange={(v) => setFamilyType(v)}
                    disabled={isLoading}
                    ariaLabel="가족 타입 선택"
                  />
                </div>
              </div>

              {/* 가족 이름 입력 */}
              <div className="space-y-2">
                <Label htmlFor="familyName" className="text-sm font-medium">
                  {familyType === "personal" ? "나의 가계부" : "가족 이름"}
                </Label>
                <Input
                  id="familyName"
                  type="text"
                  placeholder={
                    familyType === "personal"
                      ? "예: 김철수의 가계부"
                      : "예: 우리가족"
                  }
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="h-12"
                  disabled={isLoading}
                />
              </div>

              {/* 제출 버튼 */}
              <Button
                type="submit"
                className="w-full h-12 bg-brand-500 hover:bg-brand-600 text-brand-fg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    생성 중...
                  </div>
                ) : (
                  "가족 만들기"
                )}
              </Button>
            </form>

            {/* 안내 박스 */}
            <div className="mt-6 p-4 bg-brand-50 rounded-md border border-brand-100">
              <h4 className="font-semibold text-sm text-brand-700 mb-1">
                {familyType === "personal"
                  ? "혼자 사용하기"
                  : "가족과 함께 사용하기"}
              </h4>
              <p className="text-xs text-brand-700/80">
                {familyType === "personal"
                  ? "개인 지출을 관리할 수 있는 가계부를 만듭니다. 언제든지 가족을 초대할 수 있습니다."
                  : "가족 구성원들과 함께 지출을 관리할 수 있는 공유 가계부를 만듭니다."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
