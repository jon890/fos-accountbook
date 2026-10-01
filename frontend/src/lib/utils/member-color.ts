import type { FamilyMemberSummary } from "@/types/family";

export interface MemberColor {
  color: "member-1" | "member-2" | "member-3" | "member-4" | "neutral";
  bgClass: string;
  textClass: string;
  label: string;
}

const memberColors = [
  { color: "member-1", bgClass: "bg-member-1", textClass: "text-member-1" },
  { color: "member-2", bgClass: "bg-member-2", textClass: "text-member-2" },
  { color: "member-3", bgClass: "bg-member-3", textClass: "text-member-3" },
  { color: "member-4", bgClass: "bg-member-4", textClass: "text-member-4" },
] as const;

export function buildMemberColorMap(members: FamilyMemberSummary[]): Map<string, MemberColor> {
  return new Map(members.map((member, index) => [member.userUuid, {
    ...memberColors[index % memberColors.length],
    label: member.name ?? member.email ?? "구성원",
  }]));
}

export function getMemberColor(colors: Map<string, MemberColor>, userUuid: string): MemberColor {
  return colors.get(userUuid) ?? {
    color: "neutral",
    bgClass: "bg-neutral-500",
    textClass: "text-neutral-500",
    label: "이전 구성원",
  };
}
