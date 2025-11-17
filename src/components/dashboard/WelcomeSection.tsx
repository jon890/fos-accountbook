"use client";

import { useTimeZone } from "@/lib/client/timezone-context";

interface WelcomeSectionProps {
  userName?: string | null;
  familyName?: string | null;
}

export function WelcomeSection({ userName, familyName }: WelcomeSectionProps) {
  const firstName = userName?.split(" ")[0] || "사용자";
  const { timezone } = useTimeZone();

  return (
    <div className="mb-4 md:mb-8">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-0.5 md:mb-1">
            안녕하세요, {firstName}님! 👋
          </h2>
          {familyName && (
            <p className="text-xs md:text-sm text-gray-500 mb-1">
              {familyName}님 가족이 함께 관리해요
            </p>
          )}
          <p className="text-sm md:text-base text-gray-600">
            오늘도 알뜰한 가계 관리를 시작해보세요.
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm text-gray-500">오늘</p>
          <p className="text-lg font-semibold text-gray-900">
            {new Date().toLocaleDateString("ko-KR", {
              timeZone: timezone,
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
