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
import { serverApiClient } from "@/lib/server/api/client";
import { requireAuth } from "@/lib/server/auth-helpers";
import { getSelectedFamilyUuid } from "@/lib/server/cookies";
import type { GetExpensesParams } from "@/types/actions";
import type { ExpenseResponse } from "@/types/api";

interface GetExpensesData {
  expenses: ExpenseResponse[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

export async function getExpensesAction(
  params: GetExpensesParams
): Promise<ActionResult<GetExpensesData>> {
  try {
    // 인증 확인
    await requireAuth();

    // 선택된 가족 UUID 가져오기
    const familyId = await getSelectedFamilyUuid();

    // 선택된 가족이 없으면 에러
    if (!familyId) {
      throw ActionError.familyNotSelected();
    }

    const { categoryId, startDate, endDate, page = 1 } = params;

    // 페이지 검증
    if (page < 1) {
      throw ActionError.invalidInput("page", page, "1 이상이어야 합니다");
    }

    const limit = 10;
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

    const response = await serverApiClient<{
      data: {
        content: ExpenseResponse[];
        totalPages: number;
        totalElements: number;
        number: number;
      };
    }>(`/families/${familyId}/expenses?${queryParams}`, {
      method: "GET",
    });

    return successResult({
      expenses: response.data.content,
      totalPages: response.data.totalPages,
      totalElements: response.data.totalElements,
      currentPage: response.data.number,
    });
  } catch (error) {
    console.error("지출 조회 중 오류:", error);
    return handleActionError(error, "지출 조회에 실패했습니다");
  }
}
