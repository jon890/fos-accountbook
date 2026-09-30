import { Skel } from "@/components/loading/Skel";

export default function CalendarLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-5" aria-label="달력을 불러오는 중">
      <div className="flex h-11 items-center justify-between">
        <Skel w={44} h={44} />
        <Skel w={140} h={24} />
        <Skel w={44} h={44} />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }, (_, index) => <Skel key={index} h={76} />)}
      </div>
      <Skel w="45%" h={22} />
      {[0, 1, 2].map((index) => <Skel key={index} h={60} />)}
    </div>
  );
}
