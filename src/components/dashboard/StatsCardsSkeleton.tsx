import { Card, CardContent } from "@/components/ui/card";

/**
 * StatsCards 스켈레톤 UI
 * 데이터 로드 중 표시되는 로딩 상태
 */
export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-8">
      {/* 지출 카드 스켈레톤 */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white border-0 shadow-xl animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <CardContent className="relative p-3 md:p-6">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-2xl"></div>
            <div className="w-4 h-4 md:w-5 md:h-5 bg-white/20 rounded"></div>
          </div>
          <div>
            <div className="h-3 md:h-4 w-20 md:w-24 bg-white/20 rounded mb-2"></div>
            <div className="h-6 md:h-8 w-32 md:w-40 bg-white/30 rounded mb-2"></div>
            <div className="h-2 md:h-3 w-full bg-white/20 rounded"></div>
          </div>
        </CardContent>
      </Card>

      {/* 수입 카드 스켈레톤 */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-600 to-green-700 text-white border-0 shadow-xl animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <CardContent className="relative p-3 md:p-6">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-2xl"></div>
            <div className="w-4 h-4 md:w-5 md:h-5 bg-white/20 rounded"></div>
          </div>
          <div>
            <div className="h-3 md:h-4 w-20 md:w-24 bg-white/20 rounded mb-2"></div>
            <div className="h-6 md:h-8 w-32 md:w-40 bg-white/30 rounded mb-2"></div>
            <div className="h-2 md:h-3 w-24 md:w-32 bg-white/20 rounded"></div>
          </div>
        </CardContent>
      </Card>

      {/* 예산 카드 스켈레톤 */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-600 to-orange-700 text-white border-0 shadow-xl animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <CardContent className="relative p-3 md:p-6">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-2xl"></div>
            <div className="w-4 h-4 md:w-5 md:h-5 bg-white/20 rounded"></div>
          </div>
          <div>
            <div className="h-3 md:h-4 w-24 md:w-28 bg-white/20 rounded mb-2"></div>
            <div className="h-6 md:h-8 w-32 md:w-40 bg-white/30 rounded mb-2"></div>
            <div className="h-2 md:h-3 w-full bg-white/20 rounded"></div>
          </div>
        </CardContent>
      </Card>

      {/* 가족 구성원 카드 스켈레톤 */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 text-white border-0 shadow-xl animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <CardContent className="relative p-3 md:p-6">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-2xl"></div>
            <div className="w-12 h-4 md:w-16 md:h-5 bg-white/20 rounded"></div>
          </div>
          <div>
            <div className="h-3 md:h-4 w-20 md:w-24 bg-white/20 rounded mb-2"></div>
            <div className="h-6 md:h-8 w-16 md:w-20 bg-white/30 rounded mb-2"></div>
            <div className="h-2 md:h-3 w-20 md:w-24 bg-white/20 rounded"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
