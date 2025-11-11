import { Card, CardContent } from "@/components/ui/card";

/**
 * DashboardTabs 스켈레톤 UI
 * 데이터 로드 중 표시되는 로딩 상태
 */
export function DashboardTabsSkeleton() {
  return (
    <div className="animate-pulse">
      {/* 탭 스켈레톤 */}
      <div className="flex space-x-2 mb-6">
        <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
        <div className="h-10 w-24 bg-gray-100 rounded-lg"></div>
        <div className="h-10 w-24 bg-gray-100 rounded-lg"></div>
      </div>

      {/* 최근 지출 목록 스켈레톤 */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 w-24 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-5 w-24 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 w-16 bg-gray-100 rounded ml-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
