/**
 * 최근 지출 내역 조회 Server Action (대시보드용)
 */

"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { getRecentExpenses } from "@/services/dashboard/dashboard-service";
import type { RecentExpense } from "@/types/dashboard";

export async function getRecentExpensesAction(
  limit: number = 10
): Promise<ActionResult<RecentExpense[]>> {
  try {
    await requireAuth();

    if (limit < 1 || limit > 100) {
      throw ActionError.invalidInput(
        "limit",
        limit,
        "1에서 100 사이의 값이어야 합니다"
      );
    }

    const selectedFamilyUuid = await getSelectedFamilyUuid();
    if (!selectedFamilyUuid) {
      throw ActionError.familyNotSelected();
    }

    const recentExpenses = await getRecentExpenses(selectedFamilyUuid, limit);
    return successResult(recentExpenses);
  } catch (error) {
    return handleActionError(error, "최근 지출 내역을 불러오는데 실패했습니다");
  }
}
