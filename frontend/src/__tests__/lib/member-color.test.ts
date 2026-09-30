import { buildMemberColorMap, getMemberColor } from "@/lib/utils/member-color";
import type { FamilyMemberSummary } from "@/types/family";

const members: FamilyMemberSummary[] = Array.from({ length: 5 }, (_, index) => ({
  userUuid: `user-${index}`, name: `구성원 ${index}`, email: null,
  image: null, role: "MEMBER", joinedAt: `2026-01-0${index + 1}`,
}));

describe("구성원 색", () => {
  it("가입 순서대로 네 색을 배정하고 다섯 번째부터 반복한다", () => {
    const colors = buildMemberColorMap(members);
    expect(Array.from(colors.values()).map((entry) => entry.color)).toEqual([
      "member-1", "member-2", "member-3", "member-4", "member-1",
    ]);
    expect(getMemberColor(colors, "user-0")).toEqual({
      color: "member-1", bgClass: "bg-member-1", textClass: "text-member-1", label: "구성원 0",
    });
  });

  it("없는 사용자와 빈 구성원 목록은 이전 구성원으로 표시한다", () => {
    expect(getMemberColor(buildMemberColorMap([]), "unknown")).toEqual({
      color: "neutral", bgClass: "bg-neutral-500", textClass: "text-neutral-500", label: "이전 구성원",
    });
  });

  it("이름이 없으면 이메일, 둘 다 없으면 구성원으로 표시한다", () => {
    const colors = buildMemberColorMap([
      { ...members[0], name: null, email: "user@example.com" },
      { ...members[1], name: null },
    ]);
    expect(getMemberColor(colors, "user-0").label).toBe("user@example.com");
    expect(getMemberColor(colors, "user-1").label).toBe("구성원");
  });
});
