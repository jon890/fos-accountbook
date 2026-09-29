/**
 * 대시보드 통계 데이터 조회 Server Action
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
import { getDashboardStats } from "@/services/dashboard/dashboard-service";
import type { DashboardStats } from "@/types/dashboard";

export async function getDashboardStatsAction(): Promise<
  ActionResult<DashboardStats>
> {
  try {
    await requireAuth();

    const selectedFamilyUuid = await getSelectedFamilyUuid();
    if (!selectedFamilyUuid) {
      throw ActionError.familyNotSelected();
    }

    const stats = await getDashboardStats(selectedFamilyUuid);
    return successResult(stats);
  } catch (error) {
    return handleActionError(error, "대시보드 통계를 불러오는데 실패했습니다");
  }
}
