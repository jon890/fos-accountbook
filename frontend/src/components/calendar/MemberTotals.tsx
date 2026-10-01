import { formatCurrency } from "@/lib/utils/format";
import { getMemberColor, type MemberColor } from "@/lib/utils/member-color";
import type { DailyStatsWithMembers } from "@/types/dashboard";

interface MemberTotalsProps {
  daily: DailyStatsWithMembers;
  colors: Map<string, MemberColor>;
}

export function MemberTotals({ daily, colors }: MemberTotalsProps) {
  const totals = new Map(daily.memberExpenseTotals.map((member) => [member.userUuid, member.amount]));
  const memberUuids = [...colors.keys(), ...totals.keys()].filter((uuid, index, items) => items.indexOf(uuid) === index);

  return (
    <div className="space-y-3 px-1">
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
        {memberUuids.map((uuid) => {
          const member = getMemberColor(colors, uuid);
          return (
            <li key={uuid} className="flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${member.bgClass}`} aria-hidden="true" />
              <span className="text-fg-muted">{member.label}</span>
              <span className="num font-semibold text-fg">{formatCurrency(totals.get(uuid) ?? 0)}</span>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-fg-muted">
        <span>가족 지출 <span className="num font-semibold text-expense">{formatCurrency(daily.totalExpense)}</span></span>
        <span>가족 수입 <span className="num font-semibold text-income">{formatCurrency(daily.totalIncome)}</span></span>
      </div>
    </div>
  );
}
