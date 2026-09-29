"use server";

import { z } from "zod";
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
import { getMonthlyTrend } from "@/services/analytics/analytics-service";
import { ANALYTICS_PERIODS, type AnalyticsPeriod, type MonthlyTrend } from "@/types/analytics";

const schema = z.object({
  period: z.enum(ANALYTICS_PERIODS),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export async function getMonthlyTrendAction(
  period: AnalyticsPeriod,
  year?: number,
  month?: number,
): Promise<ActionResult<MonthlyTrend>> {
  try {
    await requireAuth();

    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    const now = new Date();
    const parsed = schema.parse({
      period,
      year: year ?? now.getFullYear(),
      month: month ?? now.getMonth() + 1,
    });

    const trend = await getMonthlyTrend(familyUuid, parsed.period, parsed.year, parsed.month);
    return successResult(trend);
  } catch (error) {
    return handleActionError(error, "월별 추이를 불러오는데 실패했습니다");
  }
}
