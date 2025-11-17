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
import { serverApiGet } from "@/lib/server/api";
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import type { DashboardStats } from "@/types/dashboard";

export async function getDashboardStatsAction(): Promise<
  ActionResult<DashboardStats>
> {
  try {
    // 인증 확인
    await requireAuth();

    // 선택된 가족 UUID 가져오기
    const selectedFamilyUuid = await getSelectedFamilyUuid();

    // 선택된 가족이 없으면 에러
    if (!selectedFamilyUuid) {
      throw ActionError.familyNotSelected();
    }

    // 현재 연도와 월 계산
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // 월별 통계 조회
    const stats = await serverApiGet<DashboardStats>(
      `/families/${selectedFamilyUuid}/dashboard/stats/monthly?year=${year}&month=${month}`
    );

    return successResult(stats);
  } catch (error) {
    console.error("Failed to load dashboard stats:", error);
    return handleActionError(error, "대시보드 통계를 불러오는데 실패했습니다");
  }
}
