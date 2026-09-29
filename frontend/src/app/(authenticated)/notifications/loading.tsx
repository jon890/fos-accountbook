import { Skel } from "@/components/loading/Skel";

export default function NotificationsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <Skel w="30%" h={24} />
        <Skel w={88} h={32} r={8} />
      </div>
      <Skel w="100%" h={40} r={10} />
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 p-4 rounded-xl border border-border">
            <Skel w={40} h={40} r={999} />
            <div className="flex-1 space-y-2">
              <Skel w="60%" h={14} />
              <Skel w="90%" h={12} />
              <Skel w="20%" h={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
