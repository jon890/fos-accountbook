"use client";

import { SettingsCard } from "@/components/layout/SettingsCard";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/client/utils";
import { SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const themeOptions = [
  { value: "system", label: "시스템 설정 따르기" },
  { value: "light", label: "라이트" },
  { value: "dark", label: "다크" },
] as const;

function subscribeToMountStatus() {
  return () => {};
}

function useIsMounted() {
  return useSyncExternalStore(subscribeToMountStatus, () => true, () => false);
}

export function ThemeSettingsCard() {
  const { theme, setTheme } = useTheme();
  const isMounted = useIsMounted();

  const selectedTheme = isMounted ? theme : undefined;

  return (
    <SettingsCard
      icon={SunMoon}
      title="화면 테마"
      subtitle="이 기기에서만 적용돼요"
    >
      <RadioGroup
        value={selectedTheme}
        onValueChange={setTheme}
        className="space-y-1 px-2 pt-2 pb-3"
      >
        {themeOptions.map((option) => {
          const isSelected = selectedTheme === option.value;

          return (
            <Label
              key={option.value}
              htmlFor={`theme-${option.value}`}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md p-3 transition-colors",
                isSelected ? "bg-brand-50 text-brand-700" : "hover:bg-bg-muted"
              )}
            >
              <RadioGroupItem
                value={option.value}
                id={`theme-${option.value}`}
              />
              <span className="text-sm font-semibold">{option.label}</span>
            </Label>
          );
        })}
      </RadioGroup>
    </SettingsCard>
  );
}
