import { Skel } from "@/components/loading/Skel";

export default function AuthenticatedLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* 헤더 */}
      <Skel w="50%" h={22} />

      {/* 카드 3개 */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-bg-elev rounded-2xl p-5 space-y-3">
          <Skel w="40%" h={14} />
          <Skel h={12} />
          <Skel w="70%" h={12} />
        </div>
      ))}
    </div>
  );
}
