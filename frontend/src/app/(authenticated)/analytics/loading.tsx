import { Skel } from "@/components/loading/Skel";

export default function AnalyticsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Period 토글 */}
      <div className="flex gap-2 justify-center">
        {[72, 72, 72].map((w, i) => (
          <Skel key={i} w={w} h={34} r={17} />
        ))}
      </div>

      {/* 도넛 카드 */}
      <div className="bg-bg-elev rounded-2xl p-5 flex gap-4 items-start">
        <Skel w={120} h={120} r={60} className="shrink-0" />
        <div className="flex-1 space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1">
              <Skel w="70%" h={12} />
              <Skel w="50%" h={10} />
            </div>
          ))}
        </div>
      </div>

      {/* stat 카드 2개 */}
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="bg-bg-elev rounded-2xl p-4 space-y-2">
            <Skel w="60%" h={11} />
            <Skel w="80%" h={20} />
          </div>
        ))}
      </div>

      {/* MonthlyTrendBar — 12 bar */}
      <div className="bg-bg-elev rounded-2xl p-5">
        <Skel w="40%" h={14} className="mb-4" />
        <div className="flex items-end gap-1.5 h-[80px]">
          {[60, 80, 40, 90, 55, 70, 45, 85, 65, 50, 75, 30].map((pct, i) => (
            <Skel
              key={i}
              w="100%"
              h={Math.round((pct / 100) * 72)}
              r={4}
              className="flex-1"
            />
          ))}
        </div>
      </div>

      {/* CategoryDetailList 6 row */}
      <div className="bg-bg-elev rounded-2xl p-5 space-y-3">
        <Skel w="35%" h={14} />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skel w={32} h={32} r={8} className="shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skel w="55%" h={12} />
              <Skel h={5} r={3} />
            </div>
            <Skel w={64} h={14} className="shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
