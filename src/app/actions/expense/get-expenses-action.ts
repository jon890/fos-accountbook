/**
 * 지출 목록 조회 Server Action
 */

"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiGet } from "@/lib/server/api/client";
import { requireAuth, getSelectedFamilyUuid } from "@/lib/server/auth-helpers";
import type { GetExpensesParams, GetExpensesResponse } from "@/types/expense";

export async function getExpensesAction(
  params: GetExpensesParams
): Promise<ActionResult<GetExpensesResponse>> {
  try {
    // 인증 확인
    await requireAuth();

    // 선택된 가족 UUID 가져오기
    const familyId = await getSelectedFamilyUuid();

    // 선택된 가족이 없으면 에러
    if (!familyId) {
      throw ActionError.familyNotSelected();
    }

    const { categoryId, startDate, endDate, page = 1, limit = 25 } = params;

    // 페이지 검증
    if (page < 1) {
      throw ActionError.invalidInput("page", page, "1 이상이어야 합니다");
    }

    // limit 검증
    if (limit < 1 || limit > 1000) {
      throw ActionError.invalidInput(
        "limit",
        limit,
        "1에서 1000 사이여야 합니다"
      );
    }

    let queryParams = `page=${page - 1}&size=${limit}`;

    if (categoryId) {
      queryParams += `&categoryId=${categoryId}`;
    }
    if (startDate) {
      queryParams += `&startDate=${startDate}`;
    }
    if (endDate) {
      queryParams += `&endDate=${endDate}`;
    }

    const response = await serverApiGet<GetExpensesResponse>(
      `/families/${familyId}/expenses?${queryParams}`
    );

    return successResult(response);
  } catch (error) {
    console.error("지출 조회 중 오류:", error);
    return handleActionError(error, "지출 조회에 실패했습니다");
  }
}
