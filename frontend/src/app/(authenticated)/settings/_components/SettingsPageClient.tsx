"use client";

import { setDefaultFamilyAction } from "@/actions/user/set-default-family-action";
import { SettingsCard } from "@/components/layout/SettingsCard";
import { BudgetEditDialog } from "@/components/settings/BudgetEditDialog";
import { SettingsHero } from "@/components/settings/SettingsHero";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/client/utils";
import { useSessionRefresh } from "@/lib/client/use-session-refresh";
import type { Family } from "@/types/family";
import { Check, Edit2, Users, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface SettingsPageClientProps {
  families: Family[];
  defaultFamilyUuid: string | null;
  userName: string | null;
  userEmail: string | null;
}

export function SettingsPageClient({
  families,
  defaultFamilyUuid,
  userName,
  userEmail,
}: SettingsPageClientProps) {
  const router = useRouter();
  const { refreshSession } = useSessionRefresh();
  const [selectedFamily, setSelectedFamily] = useState<string>("");
  const [currentDefaultFamily, setCurrentDefaultFamily] = useState<string>(
    defaultFamilyUuid || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [budgetDialogFamily, setBudgetDialogFamily] = useState<Family | null>(
    null
  );

  const handleSaveDefaultFamily = async () => {
    if (!selectedFamily) {
      toast.error("기본 가족을 선택해주세요");
      return;
    }

    try {
      setIsSaving(true);
      const result = await setDefaultFamilyAction(selectedFamily);

      if (result.success) {
        setCurrentDefaultFamily(selectedFamily);
        await refreshSession();
        toast.success("기본 가족이 설정되었습니다");
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    } catch (error) {
      console.error("Failed to set default family:", error);
      toast.error("기본 가족 설정에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <SettingsHero
        userName={userName}
        userEmail={userEmail}
        defaultFamily={
          families.find((f) => f.uuid === currentDefaultFamily) ?? null
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* 기본 가족 설정 — full width */}
        <SettingsCard
          icon={Users}
          title="기본 가족 설정"
          subtitle="앱 시작 시 보여줄 가족을 선택하세요"
          className="md:col-span-2"
        >
          <div className="px-2 pt-2 pb-3">
            <RadioGroup
              value={selectedFamily || currentDefaultFamily}
              onValueChange={setSelectedFamily}
              className="space-y-1"
            >
              {families.map((family) => {
                const isSelected =
                  (selectedFamily || currentDefaultFamily) === family.uuid;
                return (
                  <div
                    key={family.uuid}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors",
                      isSelected ? "bg-brand-50" : "hover:bg-bg-muted"
                    )}
                  >
                    <RadioGroupItem value={family.uuid} id={family.uuid} />
                    <Label
                      htmlFor={family.uuid}
                      className="flex-1 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span
                          className={cn(
                            "font-semibold text-sm",
                            isSelected ? "text-brand-700" : "text-fg"
                          )}
                        >
                          {family.name}
                          {currentDefaultFamily === family.uuid && (
                            <span className="inline-flex items-center gap-1 ml-2 text-brand-500 text-xs font-medium">
                              <Check className="w-3.5 h-3.5" strokeWidth={2.6} />
                              현재 기본
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-fg-muted mt-0.5 font-num tabular-nums">
                          {family.monthlyBudget > 0
                            ? `월 예산 ₩${family.monthlyBudget.toLocaleString()}`
                            : "월 예산 미설정"}
                        </span>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>

            <div className="flex justify-end pt-3">
              <Button
                onClick={handleSaveDefaultFamily}
                disabled={
                  isSaving ||
                  !selectedFamily ||
                  selectedFamily === currentDefaultFamily
                }
                className="bg-brand-500 hover:bg-brand-600 text-brand-fg"
              >
                {isSaving ? "저장 중..." : "기본 가족으로 설정"}
              </Button>
            </div>
          </div>
        </SettingsCard>

        {/* 월 예산 설정 */}
        <SettingsCard
          icon={Wallet}
          title="가족별 예산 설정"
          subtitle="이번 달 목표 예산을 입력하세요"
        >
          <div className="flex flex-col">
            {families.map((family, i) => (
              <div
                key={family.uuid}
                className={cn(
                  "flex items-center justify-between px-5 py-3",
                  i > 0 && "border-t border-border"
                )}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-fg text-sm truncate">
                    {family.name}
                  </h3>
                  <p className="text-xs text-fg-muted mt-0.5 font-num tabular-nums">
                    {family.monthlyBudget > 0
                      ? `월 예산: ₩${family.monthlyBudget.toLocaleString()}`
                      : "예산 미설정"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBudgetDialogFamily(family)}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  수정
                </Button>
              </div>
            ))}
          </div>
        </SettingsCard>

        {/* 내 가족 목록 */}
        <SettingsCard
          icon={Users}
          title="내 가족 목록"
          subtitle="가족을 선택해 구성원·카테고리를 관리하세요"
        >
          <div className="flex flex-col">
            {families.map((family, i) => (
              <div
                key={family.uuid}
                className={cn(
                  "flex items-center justify-between px-5 py-3 hover:bg-bg-muted transition-colors",
                  i > 0 && "border-t border-border"
                )}
              >
                <div>
                  <h3 className="font-medium text-fg text-sm">{family.name}</h3>
                  <p className="text-xs text-fg-muted mt-0.5">
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
        </SettingsCard>
      </div>
    </div>

    {budgetDialogFamily && (
      <BudgetEditDialog
        open={!!budgetDialogFamily}
        onOpenChange={(open) => !open && setBudgetDialogFamily(null)}
        familyUuid={budgetDialogFamily.uuid}
        familyName={budgetDialogFamily.name}
        currentBudget={budgetDialogFamily.monthlyBudget}
      />
    )}
    </>
  );
}
