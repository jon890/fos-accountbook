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
import { getCategoryBreakdownWithDelta } from "@/services/analytics/analytics-service";
import type { CategoryBreakdownWithDelta } from "@/types/analytics";

const schema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export async function getCategoryBreakdownWithDeltaAction(
  year?: number,
  month?: number,
): Promise<ActionResult<CategoryBreakdownWithDelta>> {
  try {
    await requireAuth();

    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    const now = new Date();
    const parsed = schema.parse({
      year: year ?? now.getFullYear(),
      month: month ?? now.getMonth() + 1,
    });

    const breakdown = await getCategoryBreakdownWithDelta(familyUuid, parsed.year, parsed.month);
    return successResult(breakdown);
  } catch (error) {
    return handleActionError(error, "카테고리 분포 (전월 비교) 를 불러오는데 실패했습니다");
  }
}
