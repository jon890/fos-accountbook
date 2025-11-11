import { DashboardTabsSkeleton } from "@/components/dashboard/DashboardTabsSkeleton";
import { StatsCardsSkeleton } from "@/components/dashboard/StatsCardsSkeleton";
import { WelcomeSectionSkeleton } from "@/components/dashboard/WelcomeSectionSkeleton";

/**
 * Dashboard 페이지 로딩 UI (스켈레톤)
 * 페이지 이동 시 서버 컴포넌트 로드 중 자동으로 표시됨
 *
 * 실제 페이지 레이아웃과 동일한 스켈레톤을 보여주어
 * 부드러운 UX 제공
 */
export default function DashboardLoading() {
  return (
    <div className="animate-in fade-in duration-300">
      <WelcomeSectionSkeleton />
      <StatsCardsSkeleton />
      <DashboardTabsSkeleton />
    </div>
  );
}
