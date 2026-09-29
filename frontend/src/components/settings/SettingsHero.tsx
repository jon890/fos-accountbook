import { Card } from "@/components/ui/card";
import type { Family } from "@/types/family";
import { Users, Wallet } from "lucide-react";

interface SettingsHeroProps {
  userName: string | null;
  userEmail: string | null;
  defaultFamily: Family | null;
}

export function SettingsHero({
  userName,
  userEmail,
  defaultFamily,
}: SettingsHeroProps) {
  return (
    <Card className="overflow-hidden border-0 gradient-budget text-brand-fg">
      <div className="p-5 md:p-6">
        <p className="text-xs md:text-sm text-brand-fg/80 mb-1">설정</p>
        <h1 className="text-xl md:text-2xl font-bold mb-3">
          {userName ?? "사용자"}
          <span className="block text-sm md:text-base font-normal text-brand-fg/80 mt-0.5">
            {userEmail ?? ""}
          </span>
        </h1>

        {defaultFamily ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 md:gap-5 text-sm md:text-base">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-fg/80" />
              <span className="font-medium">{defaultFamily.name}</span>
              <span className="text-xs text-brand-fg/70">기본 가족</span>
            </div>
            {defaultFamily.monthlyBudget > 0 ? (
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-brand-fg/80" />
                <span className="font-num font-medium tabular-nums">
                  ₩{defaultFamily.monthlyBudget.toLocaleString()}
                </span>
                <span className="text-xs text-brand-fg/70">월 예산</span>
              </div>
            ) : (
              <span className="text-xs text-brand-fg/70">월 예산 미설정</span>
            )}
          </div>
        ) : (
          <p className="text-sm text-brand-fg/80 mt-3">
            기본 가족이 설정되지 않았습니다.
          </p>
        )}
      </div>
    </Card>
  );
}
