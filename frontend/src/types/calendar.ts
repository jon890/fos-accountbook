import type { DailyStatsWithMembers } from "./dashboard";
import type { Expense } from "./expense";
import type { FamilyMemberSummary } from "./family";
import type { Income } from "./income";

export interface CalendarMonth {
  year: number;
  month: number;
  daily: DailyStatsWithMembers;
  expenses: Expense[];
  incomes: Income[];
  members: FamilyMemberSummary[];
}
