import { Skel } from "@/components/loading/Skel";

export default function TransactionsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* 헤더 + 검색바 */}
      <div className="space-y-3">
        <Skel w="40%" h={22} />
        <Skel h={40} r={12} />
      </div>

      {/* 필터 chip */}
      <div className="flex gap-2">
        {[80, 64, 72].map((w, i) => (
          <Skel key={i} w={w} h={32} r={16} />
        ))}
      </div>

      {/* 탭 */}
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <Skel key={i} w="33%" h={36} r={10} />
        ))}
      </div>

      {/* 리스트 8 row */}
      <div className="bg-bg-elev rounded-2xl p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skel w={36} h={36} r={10} className="shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skel w="60%" h={13} />
              <Skel w="40%" h={10} />
            </div>
            <Skel w={60} h={14} className="shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
