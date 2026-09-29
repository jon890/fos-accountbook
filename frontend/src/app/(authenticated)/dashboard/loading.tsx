import { Skel } from "@/components/loading/Skel";

export default function DashboardLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* 헤더 */}
      <div className="space-y-2">
        <Skel w="50%" h={22} />
        <Skel w="32%" h={13} />
      </div>

      {/* Hero 카드 */}
      <div className="bg-bg-elev rounded-2xl p-5 space-y-4">
        <Skel w="40%" h={11} />
        <Skel w="65%" h={30} />
        <Skel h={6} r={4} />
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2">
              <Skel w="60%" h={10} />
              <Skel w="80%" h={16} />
            </div>
          ))}
        </div>
      </div>

      {/* 도넛 카드 */}
      <div className="bg-bg-elev rounded-2xl p-5">
        <Skel w="35%" h={14} className="mb-4" />
        <div className="flex gap-4 items-start">
          <Skel w={120} h={120} r={60} className="shrink-0" />
          <div className="flex-1 space-y-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skel w={28} h={28} r={8} className="shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skel w="70%" h={12} />
                  <Skel w="40%" h={10} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 최근 활동 리스트 */}
      <div className="bg-bg-elev rounded-2xl p-5 space-y-3">
        <Skel w="30%" h={11} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skel w={36} h={36} r={36} className="shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skel w="70%" h={12} />
              <Skel w="40%" h={10} />
            </div>
            <Skel w={70} h={14} className="shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
