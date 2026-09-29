import { Skel } from "@/components/loading/Skel";

export default function BudgetLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="space-y-2">
        <Skel w="40%" h={22} />
        <Skel w="28%" h={13} />
      </div>

      <div className="bg-bg-elev rounded-2xl p-5 space-y-4">
        <Skel w="40%" h={11} />
        <Skel w="65%" h={30} />
        <Skel h={6} r={4} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-bg-elev rounded-xl p-4 space-y-2">
            <Skel w="70%" h={10} />
            <Skel w="80%" h={20} />
            <Skel w="60%" h={9} />
          </div>
        ))}
      </div>

      <div className="bg-bg-elev rounded-2xl p-5 space-y-3">
        <Skel w="35%" h={14} />
        <Skel h={192} r={12} />
      </div>

      <div className="bg-bg-elev rounded-2xl p-5 space-y-4">
        <Skel w="30%" h={14} />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skel w={36} h={36} r={12} className="shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skel w="60%" h={12} />
              <Skel h={6} r={3} />
              <Skel w="40%" h={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
