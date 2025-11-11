import { Card, CardContent } from "@/components/ui/card";

/**
 * Dashboard Content 스켈레톤 UI
 * QuickActions와 RecentActivity 로딩 상태
 */
export function DashboardContentSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6 mb-4 md:mb-8 animate-pulse">
      {/* QuickActions 스켈레톤 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center space-x-2 md:space-x-4">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-gray-200 rounded-xl md:rounded-2xl"></div>
                <div className="flex-1">
                  <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-16 bg-gray-100 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* RecentActivity 스켈레톤 */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
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
