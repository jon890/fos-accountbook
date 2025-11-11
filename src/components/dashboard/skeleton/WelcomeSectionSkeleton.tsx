/**
 * WelcomeSection 스켈레톤 UI
 * 데이터 로드 중 표시되는 로딩 상태
 */
export function WelcomeSectionSkeleton() {
  return (
    <div className="mb-4 md:mb-8 animate-pulse">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div>
          <div className="h-6 md:h-8 w-48 md:w-64 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 md:h-5 w-40 md:w-52 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 md:h-5 w-56 md:w-72 bg-gray-200 rounded"></div>
        </div>
        <div className="hidden md:block text-right">
          <div className="h-4 w-12 bg-gray-200 rounded mb-2"></div>
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
