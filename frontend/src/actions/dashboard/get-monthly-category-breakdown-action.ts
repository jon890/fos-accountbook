"use server";

import { getDatePartsInTimezone } from "@/lib/utils/date-timezone";
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
import { getMonthlyCategoryBreakdown } from "@/services/dashboard/dashboard-service";
import type { MonthlyCategoryBreakdown } from "@/types/dashboard";

const schema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export async function getMonthlyCategoryBreakdownAction(
  year?: number,
  month?: number
): Promise<ActionResult<MonthlyCategoryBreakdown>> {
  try {
    const session = await requireAuth();

    const selectedFamilyUuid = await getSelectedFamilyUuid();
    if (!selectedFamilyUuid) {
      throw ActionError.familyNotSelected();
    }

    const current = getDatePartsInTimezone(session?.user.profile?.timezone);
    const parsed = schema.parse({
      year: year ?? current.year,
      month: month ?? current.month,
    });

    const breakdown = await getMonthlyCategoryBreakdown(
      selectedFamilyUuid,
      parsed.year,
      parsed.month
    );
    return successResult(breakdown);
  } catch (error) {
    return handleActionError(error, "카테고리 분포를 불러오는데 실패했습니다");
  }
}
