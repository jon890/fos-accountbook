import type { MemberColor } from "@/lib/utils/member-color";

export function MemberLegend({ colors }: { colors: Map<string, MemberColor> }) {
  if (colors.size === 0) {
    return null;
  }

  return (
    <ul aria-label="구성원 색상" className="flex flex-wrap gap-x-5 gap-y-2 px-1 text-xs">
      {[...colors].map(([userUuid, member]) => (
        <li key={userUuid} className="flex items-center gap-1.5">
          <span className={`size-1.5 rounded-full ${member.bgClass}`} aria-hidden="true" />
          <span className="text-fg-muted">{member.label}</span>
        </li>
      ))}
    </ul>
  );
}
