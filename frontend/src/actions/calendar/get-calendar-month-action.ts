"use server";

import { z } from "zod";
import { ActionError, ErrorCode, handleActionError, successResult, type ActionResult } from "@/lib/errors";
import { ServerApiError } from "@/lib/server/api/types";
import { requireAuth, getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { getCalendarMonth } from "@/services/calendar/calendar-service";
import type { CalendarMonth } from "@/types/calendar";

const inputSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export async function getCalendarMonthAction(
  year: number,
  month: number
): Promise<ActionResult<CalendarMonth>> {
  try {
    await requireAuth();
    const input = inputSchema.parse({ year, month });
    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }
    const data = await getCalendarMonth(familyUuid, input.year, input.month);
    return successResult(data);
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 403) {
      return new ActionError(ErrorCode.NOT_FAMILY_MEMBER).toFailureResult();
    }
    if (error instanceof ServerApiError && error.status === 404) {
      return new ActionError(ErrorCode.FAMILY_NOT_FOUND).toFailureResult();
    }
    return handleActionError(error, "달력 조회에 실패했습니다");
  }
}
