import { Bell } from "lucide-react";
import { CoupleAvatars } from "./CoupleAvatars";

interface DashboardHeaderProps {
  familyName: string | null;
  members: { uuid: string; name: string; avatarUrl?: string }[];
  year: number;
  month: number;
}

export function DashboardHeader({
  familyName,
  members,
  year,
  month,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-0 pt-2 pb-4 md:pb-6">
      <div>
        {familyName && (
          <div className="text-xs md:text-sm font-medium text-fg-muted">
            {familyName}
          </div>
        )}
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-fg mt-0.5">
          {year}년 {month}월
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="알림 (준비 중)"
          disabled
          className="p-2 rounded-full text-fg-muted opacity-60 cursor-default"
        >
          <Bell className="size-5" />
        </button>
        <CoupleAvatars members={members} />
      </div>
    </div>
  );
}
